<?php

namespace App;

use App\Service\PressReleaseService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリース取得コントローラー
 *
 * GET /press-releases/:id エンドポイントの処理を担当
 */
class GetPressReleaseController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        // IDパラメータの解析
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        try {
            $data = PressReleaseService::getById((int)$idParam);
            return self::json($response, $data);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
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
