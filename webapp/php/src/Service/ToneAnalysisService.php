<?php

namespace App\Service;

use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * AI文章トーン分析サービス
 * プレスリリースの文章品質・トーンを分析し改善提案を返す
 */
class ToneAnalysisService
{
    /**
     * プレスリリースのトーンを分析する
     *
     * @param string $title タイトル
     * @param string $body 本文
     * @return array 分析結果
     */
    public static function analyze(string $title, string $body): array
    {
        if (empty(trim($title)) && empty(trim($body))) {
            throw ServiceException::validation('EMPTY_CONTENT', 'タイトルまたは本文を入力してください');
        }

        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        $companyInfo = self::getCompanyInfo();
        $prompt = self::buildPrompt($title, $body, $companyInfo);
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
     * トーン分析用プロンプトを構築する
     */
    private static function buildPrompt(string $title, string $body, string $companyInfo): string
    {
        $companySection = '';
        if (!empty($companyInfo)) {
            $companySection = "\n【会社情報（参考）】\n{$companyInfo}\n";
        }

        return <<<PROMPT
あなたはプレスリリースの文章品質を分析する専門家です。
以下のプレスリリースのタイトルと本文を分析し、文章のトーン・品質・改善点を評価してください。
{$companySection}
以下の項目を評価してください:

1. **overall_score**: 総合スコア（0〜100点）
2. **tone**: 文章のトーン（「フォーマル」「ややカジュアル」「カジュアルすぎる」など）
3. **readability**: 読みやすさ（「読みやすい」「やや難しい」「冗長」など）
4. **news_value**: ニュース性（「高い」「普通」「低い」「不明確」など）
5. **issues**: 具体的な問題点の配列（各要素は type, location, description, suggestion を持つ）
   - type: "tone"（トーン）, "structure"（構成）, "clarity"（明確さ）, "expression"（表現）, "missing"（不足）のいずれか
   - location: 問題がある箇所（例: "タイトル", "リード文", "第2段落"）
   - description: 問題の説明
   - suggestion: 改善案
6. **strengths**: 良い点の配列（文字列）
7. **summary**: 総評（2〜3文）

以下のJSON形式で返してください。他のテキストは一切含めないでください:
{
  "overall_score": 75,
  "tone": "ややカジュアル",
  "readability": "読みやすい",
  "news_value": "普通",
  "issues": [
    {"type": "tone", "location": "タイトル", "description": "...", "suggestion": "..."},
    {"type": "structure", "location": "本文全体", "description": "...", "suggestion": "..."}
  ],
  "strengths": ["具体的な数字が含まれている", "..."],
  "summary": "全体的に..."
}

---
タイトル: {$title}

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
            'model' => 'gpt-5.4',
            'messages' => [
                ['role' => 'system', 'content' => 'あなたはプレスリリースの文章品質分析の専門家です。指定されたJSON形式のみで回答してください。'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
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
            CURLOPT_TIMEOUT => 120,
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
     * OpenAIレスポンスをパースする
     */
    private static function parseResponse(string $response): array
    {
        $cleaned = preg_replace('/^```json\s*/', '', trim($response));
        $cleaned = preg_replace('/\s*```$/', '', $cleaned);

        $parsed = json_decode($cleaned, true);

        if (!is_array($parsed) || !isset($parsed['overall_score'])) {
            throw ServiceException::external('PARSE_ERROR', 'AIの応答を解析できませんでした');
        }

        return [
            'overall_score' => (int)($parsed['overall_score'] ?? 0),
            'tone' => (string)($parsed['tone'] ?? '不明'),
            'readability' => (string)($parsed['readability'] ?? '不明'),
            'news_value' => (string)($parsed['news_value'] ?? '不明'),
            'issues' => is_array($parsed['issues'] ?? null) ? $parsed['issues'] : [],
            'strengths' => is_array($parsed['strengths'] ?? null) ? $parsed['strengths'] : [],
            'summary' => (string)($parsed['summary'] ?? ''),
        ];
    }
}
