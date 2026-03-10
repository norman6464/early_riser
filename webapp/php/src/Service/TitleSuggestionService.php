<?php

namespace App\Service;

use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * AIタイトル提案サービス
 * 本文と会社情報を元に、プレスリリースのタイトル候補を複数生成する
 */
class TitleSuggestionService
{
    /**
     * プレスリリース本文からタイトル候補を生成する
     *
     * @param string $body プレスリリース本文
     * @param string $currentTitle 現在のタイトル（参考用）
     * @return array タイトル候補の配列
     */
    public static function suggest(string $body, string $currentTitle = ''): array
    {
        if (empty(trim($body))) {
            throw ServiceException::validation('EMPTY_BODY', '本文を入力してからタイトル提案をご利用ください');
        }

        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        $companyInfo = self::getCompanyInfo();
        $prompt = self::buildPrompt($body, $currentTitle, $companyInfo);
        $response = self::callOpenAI($apiKey, $prompt);

        return self::parseResponse($response);
    }

    /**
     * 会社情報を文字列として取得する
     */
    private static function getCompanyInfo(): string
    {
        try {
            $company = CompanyRepository::findById(1);
            if (!$company) {
                return '';
            }

            $businesses = CompanyBusinessRepository::findByCompanyId(1);
            $businessList = array_map(fn($b) => $b['description'], $businesses);

            $info = "会社名: {$company['name']}\n";
            if (!empty($company['location'])) {
                $info .= "所在地: {$company['location']}\n";
            }
            if (!empty($company['employee_count'])) {
                $info .= "従業員数: {$company['employee_count']}名\n";
            }
            if (!empty($businessList)) {
                $info .= "事業内容: " . implode('、', $businessList) . "\n";
            }
            if (!empty($company['appeal'])) {
                $info .= "アピールポイント: {$company['appeal']}\n";
            }

            return $info;
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * タイトル提案用プロンプトを構築する
     */
    private static function buildPrompt(string $body, string $currentTitle, string $companyInfo): string
    {
        $companySection = '';
        if (!empty($companyInfo)) {
            $companySection = "\n【会社情報】\n{$companyInfo}\n";
        }

        $currentTitleSection = '';
        if (!empty(trim($currentTitle))) {
            $currentTitleSection = "\n現在のタイトル: {$currentTitle}\n";
        }

        return <<<PROMPT
あなたはプレスリリースのタイトル作成のプロフェッショナルです。
以下のプレスリリース本文と会社情報を読み、魅力的なタイトル候補を5つ提案してください。
{$companySection}{$currentTitleSection}
ルール:
- 各タイトルは30〜50文字程度で、簡潔かつインパクトのあるものにする
- メディア記者が記事にしたくなるようなニュース性のあるタイトルにする
- 数字や具体的な成果があれば積極的に盛り込む
- 会社情報がある場合は会社の強みや特徴を活かす
- 5つのタイトルはそれぞれ異なるアプローチ（事実伝達型、課題解決型、数字訴求型、未来志向型、業界インパクト型）で作成する
- 現在のタイトルがある場合、それを改善する方向で提案する

以下のJSON形式で返してください。他のテキストは一切含めないでください:
{"titles": ["タイトル1", "タイトル2", "タイトル3", "タイトル4", "タイトル5"]}

---
本文:
{$body}
PROMPT;
    }

    /**
     * OpenAI Chat Completions APIを呼び出す
     */
    private static function callOpenAI(string $apiKey, string $prompt): string
    {
        $payload = json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'あなたはプレスリリースのタイトル作成の専門家です。指定されたJSON形式のみで回答してください。'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.8,
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
     * OpenAIレスポンスをパースしてタイトル配列を返す
     */
    private static function parseResponse(string $response): array
    {
        $cleaned = preg_replace('/^```json\s*/', '', trim($response));
        $cleaned = preg_replace('/\s*```$/', '', $cleaned);

        $parsed = json_decode($cleaned, true);

        if (!is_array($parsed) || !isset($parsed['titles']) || !is_array($parsed['titles'])) {
            throw ServiceException::external('PARSE_ERROR', 'AIの応答を解析できませんでした');
        }

        // 文字列のみフィルタリング
        $titles = array_values(array_filter($parsed['titles'], 'is_string'));

        if (empty($titles)) {
            throw ServiceException::external('PARSE_ERROR', 'タイトル候補を取得できませんでした');
        }

        return $titles;
    }
}
