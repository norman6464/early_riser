<?php

namespace App;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class AiController
{
    /**
     * OpenAI Chat Completions APIを呼び出す共通ヘルパー
     */
    private static function callOpenAI(string $systemPrompt, string $userMessage): string
    {
        $apiKey = getenv('OPENAI_API_KEY');

        $payload = json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userMessage],
            ],
        ]);

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($result === false) {
            throw new \RuntimeException('OpenAI API request failed: ' . $curlError);
        }

        if ($httpCode !== 200) {
            throw new \RuntimeException('OpenAI API returned HTTP ' . $httpCode . ': ' . $result);
        }

        $decoded = json_decode($result, true);
        if (!is_array($decoded) || !isset($decoded['choices'][0]['message']['content'])) {
            throw new \RuntimeException('Unexpected OpenAI API response format');
        }

        return $decoded['choices'][0]['message']['content'];
    }

    /**
     * プレスリリース本文からタイトル候補を3つ提案する
     */
    public static function suggestTitles(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || empty($data['content']) || !is_string($data['content'])) {
            $response->getBody()->write(json_encode(['code' => 'INVALID_REQUEST', 'message' => 'content is required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $content = $data['content'];

        $systemPrompt = 'あなたはプレスリリースのプロの編集者です。中小企業の広報担当者が書いたプレスリリースの本文を読み、メディアに取り上げられやすい魅力的なタイトルを3つ提案してください。各タイトルは100文字以内で、JSON配列形式で返してください。例: ["タイトル1", "タイトル2", "タイトル3"]';

        try {
            $result = self::callOpenAI($systemPrompt, $content);

            // APIレスポンスからJSON配列をパースする
            $titles = json_decode($result, true);
            if (!is_array($titles)) {
                // JSON部分を抽出して再試行する
                if (preg_match('/\[.*\]/s', $result, $matches)) {
                    $titles = json_decode($matches[0], true);
                }
            }

            if (!is_array($titles)) {
                throw new \RuntimeException('Failed to parse titles from OpenAI response');
            }

            $response->getBody()->write(json_encode(['titles' => array_values($titles)]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\RuntimeException $e) {
            $response->getBody()->write(json_encode(['code' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * テキストをプレスリリースとして校正する
     */
    public static function proofread(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || empty($data['text']) || !is_string($data['text'])) {
            $response->getBody()->write(json_encode(['code' => 'INVALID_REQUEST', 'message' => 'text is required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $text = $data['text'];

        $systemPrompt = 'あなたはプレスリリースのプロの校正者です。以下のテキストを、プレスリリースとしてより読みやすく、プロフェッショナルな文体に校正してください。内容の意味は変えず、文法・表現・読みやすさを改善してください。校正後のテキストのみを返してください。';

        try {
            $result = self::callOpenAI($systemPrompt, $text);

            $response->getBody()->write(json_encode(['text' => $result]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\RuntimeException $e) {
            $response->getBody()->write(json_encode(['code' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
