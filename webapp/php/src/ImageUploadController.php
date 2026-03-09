<?php

namespace App;

use Aws\S3\S3Client;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class ImageUploadController
{
    private const ALLOWED_CONTENT_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    private const PRESIGNED_URL_EXPIRY = '+10 minutes';

    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = json_decode((string)$request->getBody(), true);
        $contentType = $body['contentType'] ?? '';
        $fileName = $body['fileName'] ?? '';

        if (!in_array($contentType, self::ALLOWED_CONTENT_TYPES, true)) {
            $response->getBody()->write(json_encode([
                'error' => '許可されていないファイル形式です。JPEG, PNG, GIF, WebPのみアップロードできます。',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $bucket = getenv('AWS_BUCKET_IMAGES') ?: '';
        $bucketUrl = getenv('AWS_BUCKET_IMAGES_URL') ?: '';
        $region = getenv('AWS_REGION') ?: 'ap-northeast-1';

        $extension = match ($contentType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'bin',
        };

        $key = 'images/' . uniqid('img_', true) . '.' . $extension;

        $s3 = new S3Client([
            'region' => $region,
            'version' => 'latest',
        ]);

        $cmd = $s3->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $key,
            'ContentType' => $contentType,
        ]);

        $presignedRequest = $s3->createPresignedRequest($cmd, self::PRESIGNED_URL_EXPIRY);
        $uploadUrl = (string)$presignedRequest->getUri();

        $imageUrl = rtrim($bucketUrl, '/') . '/' . $key;

        $response->getBody()->write(json_encode([
            'uploadUrl' => $uploadUrl,
            'imageUrl' => $imageUrl,
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
