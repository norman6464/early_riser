<?php

namespace App\Service;

/**
 * OpenAI APIを使ったプレスリリース生成サービス
 */
class AiGenerateService
{
    /**
     * プレスリリース候補を生成する
     *
     * @param array $params リクエストパラメータ
     * @return array 生成結果（candidatesを含むJSON）
     * @throws ServiceException APIエラー時
     */
    public static function generate(array $params): array
    {
        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        $systemPrompt = self::buildSystemPrompt();
        $userPrompt = self::buildUserPrompt($params);

        $responseText = self::callOpenAI($apiKey, $systemPrompt, $userPrompt);

        return self::parseResponse($responseText);
    }

    /**
     * システムプロンプトを組み立てる
     */
    private static function buildSystemPrompt(): string
    {
        return <<<'PROMPT'
あなたは中小企業の隠れた魅力を引き出し、メディアの注目を集める凄腕のPRディレクターです。
以下の【成功するPRの黄金法則】を必ず守り、読者の心を動かすプレスリリースを作成してください。
出力は指定されたJSON形式のみとし、他のテキストは一切含めないでください。

【成功するPRの黄金法則】
1. ストーリーの重視: 単なる機能紹介ではなく、「なぜそれをやるのか」「どんな苦労や経営課題を乗り越えたのか」という開発秘話や背景を前面に出すこと。
2. 意外性とギャップ: 「土木会社×スキンクリーム」「町工場×スタイリッシュ」「老舗和菓子店×非日常」のような、業界の常識を覆す意外な組み合わせや発想の転換を強調すること。
3. 社会的意義の提示: 自社の利益だけでなく、「製造業のネガティブなイメージを変えたい」「伝統技術を次世代へ繋ぐ」といった大きなビジョンや情熱を語ること。
4. 解像度の高い描写: 「○○」のようなプレースホルダー（穴埋め）は極力避け、提供された情報を最大限に膨らませて具体的な文章にすること。
PROMPT;
    }

    /**
     * ユーザープロンプトを組み立てる
     */
    private static function buildUserPrompt(array $params): string
    {
        $companyName = $params['companyName'];
        $categoryName = $params['categoryName'];
        $purpose = $params['purpose'] ?? '';
        $businessDescription = $params['businessDescription'] ?? '';
        $employeeCount = $params['employeeCount'] ?? '';
        $challenge = $params['challenge'] ?? '';
        $appeal = $params['appeal'] ?? '';

        $purposeText = !empty($purpose) ? $purpose : 'ステークホルダーへの周知と自社のブランディング向上';
        $challengeText = !empty($challenge) ? $challenge : '未設定';
        $appealText = !empty($appeal) ? $appeal : '未設定';
        $businessText = !empty($businessDescription) ? $businessDescription : '未設定';
        $employeeText = !empty($employeeCount) ? (string)$employeeCount : '未設定';

        return <<<PROMPT
以下の【発信の目的】と【カテゴリ】を最重要テーマとして、3つの異なる切り口（アプローチ）でプレスリリースのテンプレート候補を生成してください。
【企業情報】は、そのストーリーを裏付けるための背景（スパイス）として自然に組み込んでください。

## 1. 最重要テーマ
- プレスリリースの目的: {$purposeText}
- カテゴリ: {$categoryName}

## 2. 背景となる企業情報
- 会社名: {$companyName}
- 自社の課題・背景: {$challengeText}
- アピールポイント: {$appealText}
- 事業内容: {$businessText}
- 従業員数: {$employeeText}名

## 3. 指示事項
- 3つの候補は、上記の「黄金法則」に基づき、それぞれ全く異なる切り口（例: 開発ストーリー特化型、業界課題解決型、地域・社会貢献型など）で作成してください。
- 各候補はプレスリリースとして適切な構成（キャッチーな見出し、リード文、本文、今後の展望、会社概要など）を含めること。

## 4. 出力JSON形式（厳守）
{
  "candidates": [
    {
      "title": "読者の目を惹きつけるキャッチーなタイトル",
      "content": {
        "type": "doc",
        "content": [
          {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "見出し"}]},
          {"type": "paragraph", "content": [{"type": "text", "text": "本文テキスト"}]},
          {"type": "paragraph"}
        ]
      }
    }
  ]
}

※contentのノードタイプは heading(attrs: {level: 2}), paragraph, text のみを使用し、空行は {"type": "paragraph"} で表現してください。
PROMPT;
    }

    /**
     * OpenAI Chat Completions APIを呼び出す
     *
     * @return string APIレスポンスのテキスト
     * @throws ServiceException APIエラー時
     */
    private static function callOpenAI(string $apiKey, string $systemPrompt, string $userPrompt): string
    {
        $payload = json_encode([
            'model' => 'gpt-5.4',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
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
            CURLOPT_TIMEOUT => 300,
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
     * @return array candidatesを含む配列
     * @throws ServiceException パースエラー時
     */
    private static function parseResponse(string $response): array
    {
        // JSONブロックを抽出（```json ... ``` で囲まれている場合に対応）
        $cleaned = preg_replace('/^```json\s*/', '', trim($response));
        $cleaned = preg_replace('/```$/', '', trim($cleaned));

        $parsed = json_decode($cleaned, true);
        if (!is_array($parsed) || !isset($parsed['candidates'])) {
            throw ServiceException::external('AI_PARSE_ERROR', 'Failed to parse AI response as expected JSON format');
        }

        return $parsed;
    }
}
