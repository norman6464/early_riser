<?php

namespace App;

use App\Service\AiGenerateService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * AI プレスリリース生成コントローラー
 */
class AiGenerateController
{
    /**
     * プレスリリース候補を生成する
     */
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data)) {
            return self::json($response, ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON'], 400);
        }

        // 必須パラメータのバリデーション
        if (empty($data['companyName']) || !is_string($data['companyName'])) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'companyName is required and must be a string'], 400);
        }
        if (empty($data['categoryName']) || !is_string($data['categoryName'])) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'categoryName is required and must be a string'], 400);
        }

        try {
            $result = AiGenerateService::generate($data);
            return self::json($response, $result);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    private static function json(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
