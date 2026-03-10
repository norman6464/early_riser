<?php

namespace App;

use App\Service\PressReleaseService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリース保存コントローラー
 *
 * POST /press-releases/:id エンドポイントの処理を担当
 */
class SavePressReleaseController
{
    public static function handle(
        ServerRequestInterface $request,
        ResponseInterface $response,
        array $args
    ): ResponseInterface {
        // IDパラメータの解析
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        // リクエストボディの解析
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return self::json($response, ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON'], 400);
        }

        $data = is_array($data) ? $data : [];

        if (
            !array_key_exists('title', $data) ||
            !array_key_exists('content', $data) ||
            !is_string($data['title']) ||
            !is_string($data['content'])
        ) {
            return self::json($response, ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Title and content are required'], 400);
        }

        try {
            $result = PressReleaseService::update(
                (int)$idParam,
                $data['title'],
                $data['content'],
                isset($data['company_id']) ? (int)$data['company_id'] : null,
                isset($data['category_id']) ? (int)$data['category_id'] : null,
                $data['goal'] ?? ''
            );
            return self::json($response, $result);
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
