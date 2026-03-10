<?php

namespace App;

use App\Service\ProofreadService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 誤字修正コントローラー
 *
 * OpenAI APIを使ったテキスト校正を担当
 */
class ProofreadController
{
    /**
     * テキストを校正する
     */
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data)) {
            return self::json($response, ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON'], 400);
        }

        $title = $data['title'] ?? '';
        $bodyText = $data['body'] ?? '';

        if (!is_string($title) || !is_string($bodyText)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'title and body must be strings'], 400);
        }

        try {
            $result = ProofreadService::proofread($title, $bodyText);
            return self::json($response, [
                'original_title' => $title,
                'original_body' => $bodyText,
                'corrected_title' => $result['title'],
                'corrected_body' => $result['body'],
            ]);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    private static function json(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
