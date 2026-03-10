<?php

namespace App;

use App\Service\ImageUploadService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 画像アップロードコントローラー
 *
 * POST /api/images/presigned-url エンドポイントの処理を担当
 */
class ImageUploadController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = json_decode((string)$request->getBody(), true);
        $contentType = $body['contentType'] ?? '';
        $fileName = $body['fileName'] ?? '';

        try {
            $result = ImageUploadService::generatePresignedUrl($contentType, $fileName);
            return self::json($response, $result);
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
