<?php

namespace App\Service;

use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * AIセクションガイドサービス
 * プレスリリースの各セクションをAIが生成する
 */
class SectionGuideService
{
    /**
     * セクション定義
     * 各セクションのID・名前・質問・プロンプトテンプレートを定義
     */
    private const SECTIONS = [
        'lead' => [
            'name' => 'リード文',
            'questions' => [
                '今回発表する内容を一言で表すと何ですか？',
                'いつ発表・開始しますか？（日付）',
            ],
        ],
        'background' => [
            'name' => '背景・課題',
            'questions' => [
                'この発表の背景にある業界の課題や社会的な問題は何ですか？',
                'なぜ今このタイミングで発表するのですか？',
            ],
        ],
        'service' => [
            'name' => 'サービス・製品概要',
            'questions' => [
                'サービスや製品の主な特徴・機能を教えてください',
                '他社との違い・独自の強みは何ですか？',
            ],
        ],
        'future' => [
            'name' => '今後の展望',
            'questions' => [
                '今後の目標や計画を教えてください（数値目標があれば含めて）',
                '将来的にどのような展開を予定していますか？',
            ],
        ],
        'company' => [
            'name' => '会社概要',
            'questions' => [
                '特にアピールしたい実績やポイントがあれば教えてください',
            ],
        ],
    ];

    /**
     * セクション定義一覧を返す（フロントエンド表示用）
     */
    public static function getSections(): array
    {
        $result = [];
        foreach (self::SECTIONS as $id => $section) {
            $result[] = [
                'id' => $id,
                'name' => $section['name'],
                'questions' => $section['questions'],
            ];
        }
        return $result;
    }

    /**
     * 指定セクションの文章をAIで生成する
     *
     * @param string $sectionId セクションID
     * @param array $answers 質問への回答
     * @param string $title 現在のタイトル（参考用）
     * @return array ['content' => '生成された文章']
     */
    public static function generate(string $sectionId, array $answers, string $title = ''): array
    {
        if (!isset(self::SECTIONS[$sectionId])) {
            throw ServiceException::validation('INVALID_SECTION', '無効なセクションIDです');
        }

        $hasContent = false;
        foreach ($answers as $answer) {
            if (is_string($answer) && !empty(trim($answer))) {
                $hasContent = true;
                break;
            }
        }
        if (!$hasContent) {
            throw ServiceException::validation('EMPTY_ANSWERS', '少なくとも1つの質問に回答してください');
        }

        $apiKey = getenv('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw ServiceException::external('OPENAI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }

        $companyInfo = self::getCompanyInfo();
        $prompt = self::buildPrompt($sectionId, $answers, $title, $companyInfo);
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
            if (!empty($company['challenge'])) {
                $info .= "課題: {$company['challenge']}\n";
            }

            return $info;
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * セクション別プロンプトを構築する
     */
    private static function buildPrompt(string $sectionId, array $answers, string $title, string $companyInfo): string
    {
        $section = self::SECTIONS[$sectionId];
        $sectionName = $section['name'];
        $questions = $section['questions'];

        $companySection = '';
        if (!empty($companyInfo)) {
            $companySection = "\n【会社情報】\n{$companyInfo}\n";
        }

        $titleSection = '';
        if (!empty(trim($title))) {
            $titleSection = "\nプレスリリースのタイトル: {$title}\n";
        }

        // 質問と回答のペアを構築
        $qaSection = '';
        foreach ($questions as $i => $question) {
            $answer = isset($answers[$i]) && is_string($answers[$i]) ? trim($answers[$i]) : '';
            if (!empty($answer)) {
                $qaSection .= "Q: {$question}\nA: {$answer}\n\n";
            }
        }

        // セクション別の指示
        $sectionInstructions = self::getSectionInstructions($sectionId);

        return <<<PROMPT
あなたはプレスリリース作成のプロフェッショナルです。
以下の情報を元に、プレスリリースの「{$sectionName}」セクションを作成してください。
{$companySection}{$titleSection}
【ユーザーの回答】
{$qaSection}

【作成ルール】
{$sectionInstructions}
- プレスリリースにふさわしいフォーマルな文体で書く
- 具体的な数字や固有名詞があれば積極的に活用する
- 会社情報がある場合は適切に反映する
- 簡潔で分かりやすい日本語で書く
- HTMLタグは使わず、プレーンテキストで書く
- 段落は改行で区切る

以下のJSON形式で返してください。他のテキストは一切含めないでください:
{"content": "生成されたセクションのテキスト"}
PROMPT;
    }

    /**
     * セクション別の具体的な作成指示を返す
     */
    private static function getSectionInstructions(string $sectionId): string
    {
        return match ($sectionId) {
            'lead' => <<<INST
- リード文は2〜3文で簡潔にまとめる
- 5W1H（誰が・何を・いつ・どこで・なぜ・どのように）を網羅する
- 最初の1文で最も重要な情報を伝える
- 「〜を発表しました」「〜を開始します」等のフォーマルな表現を使う
INST,
            'background' => <<<INST
- 業界の現状や社会的課題を客観的に説明する
- データや統計があれば引用する
- 課題からソリューション（今回の発表）への自然な流れを作る
- 2〜3段落程度でまとめる
INST,
            'service' => <<<INST
- サービス・製品の特徴を箇条書き的に整理する
- 技術的な強み・独自性を明確にする
- 利用者にとってのメリットを具体的に示す
- 2〜4段落でまとめる
INST,
            'future' => <<<INST
- 具体的な数値目標があれば盛り込む
- 短期・中期・長期の展望を段階的に示す
- ビジョンを簡潔に伝える
- 1〜2段落でまとめる
INST,
            'company' => <<<INST
- 会社概要は定型的なフォーマットで書く
- 会社名、所在地、代表者、設立、事業内容を含める
- 会社情報から取得した情報を正確に使う
- 特筆すべき実績やアピールポイントがあれば含める
INST,
            default => '- 読みやすく簡潔に書く',
        };
    }

    /**
     * OpenAI Chat Completions APIを呼び出す
     */
    private static function callOpenAI(string $apiKey, string $prompt): string
    {
        $payload = json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'あなたはプレスリリース作成の専門家です。指定されたJSON形式のみで回答してください。'],
                ['role' => 'user', 'content' => $prompt],
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
            CURLOPT_TIMEOUT => 45,
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

        if (!is_array($parsed) || !isset($parsed['content'])) {
            throw ServiceException::external('PARSE_ERROR', 'AIの応答を解析できませんでした');
        }

        return ['content' => (string)$parsed['content']];
    }
}
