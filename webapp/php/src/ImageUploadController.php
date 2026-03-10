<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\ImageUploadService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 画像アップロードコントローラー
 */
class ImageUploadController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        $contentType = $data['contentType'] ?? '';
        $fileName = $data['fileName'] ?? '';

        $result = ImageUploadService::generatePresignedUrl($contentType, $fileName);
        return JsonResponder::json($response, $result);
    }
}
