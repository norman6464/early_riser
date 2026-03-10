<?php

namespace App;

use App\Service\TemplateService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * テンプレートコントローラー
 *
 * テンプレートのCRUD操作を担当
 */
class TemplateController
{
    public static function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $templates = TemplateService::getAll();
            return self::json($response, $templates);
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    public static function save(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || !is_string($data['name'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'name is required'], 400);
        }

        try {
            $template = TemplateService::create(
                $data['name'],
                $data['title'] ?? '',
                $data['content'] ?? ''
            );
            return self::json($response, $template, 201);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    public static function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        try {
            TemplateService::delete((int)$idParam);
            return self::json($response, ['message' => 'Deleted']);
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
