<?php

namespace App;

use App\Service\PressReleaseCategoryService;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリースカテゴリコントローラー
 *
 * カテゴリ一覧の取得を担当
 */
class PressReleaseCategoryController
{
    /**
     * カテゴリ一覧を取得する
     */
    public static function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $categories = PressReleaseCategoryService::getAll();
            return self::json($response, $categories);
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    private static function json(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
