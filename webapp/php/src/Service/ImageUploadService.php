<?php

namespace App\Service;

use Aws\S3\S3Client;

/**
 * 画像アップロードのビジネスロジックを担当するサービス
 */
class ImageUploadService
{
    private const ALLOWED_CONTENT_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    private const PRESIGNED_URL_EXPIRY = '+10 minutes';

    /**
     * S3のPresigned URLを生成する
     *
     * @return array uploadUrl と imageUrl を含む配列
     * @throws ServiceException 許可されていないファイル形式の場合
     */
    public static function generatePresignedUrl(string $contentType, string $fileName): array
    {
        if (!in_array($contentType, self::ALLOWED_CONTENT_TYPES, true)) {
            throw ServiceException::validation(
                'INVALID_CONTENT_TYPE',
                '許可されていないファイル形式です。JPEG, PNG, GIF, WebPのみアップロードできます。'
            );
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

        return [
            'uploadUrl' => $uploadUrl,
            'imageUrl' => $imageUrl,
        ];
    }
}
