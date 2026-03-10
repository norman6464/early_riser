<?php

namespace App\Service;

use App\Repository\ChatMessageRepository;
use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * AIチャットサービス
 * 会社情報を元にプレスリリース作成のアドバイスを提供する
 */
class ChatService
{
    /**
     * チャット履歴を取得する
     */
    public static function getHistory(int $pressReleaseId): array
    {
        return ChatMessageRepository::findByPressReleaseId($pressReleaseId);
    }

    /**
     * ユーザーメッセージを保存し、AIの応答をSSEでストリーミング返却する
     *
     * この関数はレスポンスを直接出力する（SSE形式）
     */
    public static function streamChat(int $pressReleaseId, string $userMessage): void
    {
        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        if (empty(trim($userMessage))) {
            throw ServiceException::validation('EMPTY_MESSAGE', 'Message is required');
        }

        // ユーザーメッセージをDBに保存
        ChatMessageRepository::create($pressReleaseId, 'user', $userMessage);

        // 会社情報を取得してシステムプロンプトを構築
        $systemPrompt = self::buildSystemPrompt();

        // 過去の会話履歴を取得
        $history = ChatMessageRepository::getRecentHistory($pressReleaseId);

        // OpenAI APIにストリーミングリクエスト
        $messages = self::buildMessages($systemPrompt, $history);
        $fullResponse = self::callOpenAIStream($apiKey, $messages);

        // AIの応答をDBに保存
        ChatMessageRepository::create($pressReleaseId, 'assistant', $fullResponse);
    }

    /**
     * 会社情報を元にシステムプロンプトを構築する
     */
    private static function buildSystemPrompt(): string
    {
        $companyInfo = '';

        try {
            // 会社情報の取得（ID=1を想定）
            $company = CompanyRepository::findById(1);
            if ($company) {
                $businesses = CompanyBusinessRepository::findByCompanyId(1);
                $businessList = array_map(fn($b) => $b['description'], $businesses);

                $companyInfo = "\n\n【会社情報】\n";
                $companyInfo .= "会社名: {$company['name']}\n";
                if (!empty($company['location'])) {
                    $companyInfo .= "所在地: {$company['location']}\n";
                }
                if (!empty($company['employee_count'])) {
                    $companyInfo .= "従業員数: {$company['employee_count']}名\n";
                }
                if (!empty($businessList)) {
                    $companyInfo .= "事業内容: " . implode('、', $businessList) . "\n";
                }
                if (!empty($company['appeal'])) {
                    $companyInfo .= "アピールポイント: {$company['appeal']}\n";
                }
                if (!empty($company['challenge'])) {
                    $companyInfo .= "課題: {$company['challenge']}\n";
                }
            }
        } catch (\Exception $e) {
            // 会社情報の取得に失敗しても続行する
        }

        return <<<PROMPT
あなたはプレスリリース作成のプロフェッショナルアドバイザーです。
ユーザーがプレスリリースを作成する際に、適切な文章構成・表現・内容についてアドバイスしてください。

以下のルールに従ってください:
- プレスリリースの基本構成（タイトル、リード文、本文、会社概要）に沿ったアドバイスをする
- 読み手（メディア記者・一般読者）を意識した表現を提案する
- 具体的な文章例を含めて提案する
- 日本語で回答する
- 簡潔で分かりやすい回答を心がける{$companyInfo}
PROMPT;
    }

    /**
     * OpenAI APIに渡すメッセージ配列を構築する
     */
    private static function buildMessages(string $systemPrompt, array $history): array
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        return $messages;
    }

    /**
     * OpenAI APIをストリーミングで呼び出し、SSE形式で出力する
     *
     * @return string 完全な応答テキスト
     */
    private static function callOpenAIStream(string $apiKey, array $messages): string
    {
        $payload = json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
            'temperature' => 0.7,
            'stream' => true,
        ]);

        $ch = @curl_init('https://api.openai.com/v1/chat/completions');
        if ($ch === false) {
            throw ServiceException::external('CURL_INIT_FAILED', 'Failed to initialize curl');
        }

        $fullResponse = '';

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_TIMEOUT => 60,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, $data) use (&$fullResponse) {
                $lines = explode("\n", $data);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line)) continue;
                    if (!str_starts_with($line, 'data: ')) continue;

                    $json = substr($line, 6);
                    if ($json === '[DONE]') {
                        echo "data: [DONE]\n\n";
                        if (ob_get_level()) ob_flush();
                        flush();
                        continue;
                    }

                    $decoded = json_decode($json, true);
                    $delta = $decoded['choices'][0]['delta']['content'] ?? '';
                    if ($delta !== '') {
                        $fullResponse .= $delta;
                        // SSEイベントとして送信
                        echo "data: " . json_encode(['content' => $delta], JSON_UNESCAPED_UNICODE) . "\n\n";
                        if (ob_get_level()) ob_flush();
                        flush();
                    }
                }
                return strlen($data);
            },
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($result === false) {
            throw ServiceException::external('OPENAI_CONNECTION_ERROR', 'OpenAI API connection failed: ' . $curlError);
        }

        if ($httpCode !== 200 && $httpCode !== 0) {
            throw ServiceException::external('OPENAI_API_ERROR', 'OpenAI API returned status ' . $httpCode);
        }

        return $fullResponse;
    }
}
