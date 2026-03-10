<?php

namespace App\Service;

/**
 * OpenAI APIを使った誤字修正サービス
 */
class ProofreadService
{
    /**
     * テキストをOpenAI APIで校正する
     *
     * @param string $title タイトル
     * @param string $body 本文テキスト
     * @return array 校正結果 ['title' => '修正後タイトル', 'body' => '修正後本文']
     * @throws ServiceException APIエラー時
     */
    public static function proofread(string $title, string $body): array
    {
        if (empty(trim($title)) && empty(trim($body))) {
            throw ServiceException::validation('EMPTY_CONTENT', 'Title or body is required');
        }

        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        $prompt = self::buildPrompt($title, $body);
        $response = self::callOpenAI($apiKey, $prompt);

        return self::parseResponse($response, $title, $body);
    }

    /**
     * 校正用プロンプトを組み立てる
     */
    public static function buildPrompt(string $title, string $body): string
    {
        return <<<PROMPT
あなたはプロの日本語校正者です。以下のプレスリリースのタイトルと本文の誤字・脱字・文法ミスを修正してください。

ルール:
- 誤字・脱字・文法ミスのみを修正する
- 文章の意味や構成は変えない
- 修正がない場合は元のテキストをそのまま返す

以下のJSON形式で返してください。他のテキストは一切含めないでください:
{"title": "修正後のタイトル", "body": "修正後の本文"}

---
タイトル: {$title}

本文:
{$body}
PROMPT;
    }

    /**
     * OpenAI Chat Completions APIを呼び出す
     *
     * @return string APIレスポンスのテキスト
     * @throws ServiceException APIエラー時
     */
    private static function callOpenAI(string $apiKey, string $prompt): string
    {
        $payload = json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'あなたはプロの日本語校正者です。指定されたJSON形式のみで回答してください。'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.0,
        ]);

        $ch = @curl_init('https://api.openai.com/v1/chat/completions');
        if ($ch === false) {
            throw ServiceException::external('CURL_INIT_FAILED', 'Failed to initialize curl');
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_TIMEOUT => 30,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($result === false) {
            throw ServiceException::external('OPENAI_CONNECTION_ERROR', 'OpenAI API connection failed: ' . $curlError);
        }

        if ($httpCode !== 200) {
            throw ServiceException::external('OPENAI_API_ERROR', 'OpenAI API returned status ' . $httpCode);
        }

        $data = json_decode($result, true);
        if (!isset($data['choices'][0]['message']['content'])) {
            throw ServiceException::external('OPENAI_INVALID_RESPONSE', 'Invalid response from OpenAI API');
        }

        return $data['choices'][0]['message']['content'];
    }

    /**
     * OpenAIのレスポンスをパースする
     *
     * @return array ['title' => string, 'body' => string]
     */
    private static function parseResponse(string $response, string $originalTitle, string $originalBody): array
    {
        // JSONブロックを抽出（```json ... ``` で囲まれている場合に対応）
        $cleaned = preg_replace('/^```json\s*/', '', trim($response));
        $cleaned = preg_replace('/\s*```$/', '', $cleaned);

        $parsed = json_decode($cleaned, true);

        if (!is_array($parsed)) {
            // パースに失敗した場合は元のテキストを返す
            return [
                'title' => $originalTitle,
                'body' => $originalBody,
            ];
        }

        return [
            'title' => $parsed['title'] ?? $originalTitle,
            'body' => $parsed['body'] ?? $originalBody,
        ];
    }
}
