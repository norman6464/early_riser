<?php

namespace App\Helper;

use Psr\Http\Message\ResponseInterface;

/**
 * JSONレスポンスのヘルパー
 */
class JsonResponder
{
    /**
     * JSONレスポンスを返す
     */
    public static function json(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    /**
     * エラーレスポンスを返す
     */
    public static function error(ResponseInterface $response, string $code, string $message, int $status = 400): ResponseInterface
    {
        return self::json($response, ['code' => $code, 'message' => $message], $status);
    }

    /**
     * ルートパラメータからIDを解析・検証する
     *
     * @return int|null 有効なIDまたはnull
     */
    public static function parseId(array $args): ?int
    {
        $idParam = (string)($args['id'] ?? '');
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return null;
        }
        return (int)$idParam;
    }

    /**
     * リクエストボディをJSON配列として解析する
     *
     * @return array|null 解析結果またはnull（無効なJSON）
     */
    public static function parseJsonBody(string $body): ?array
    {
        $data = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return null;
        }
        return $data;
    }
}
