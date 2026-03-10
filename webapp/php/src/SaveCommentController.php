<?php

namespace App;

use App\Service\CommentService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SaveCommentController
{
    public static function handle(
        ServerRequestInterface $request,
        ResponseInterface $response,
        array $args
    ): ResponseInterface {
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return self::json($response, ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON'], 400);
        }

        $data = is_array($data) ? $data : [];

        if (
            !array_key_exists('body', $data) ||
            !is_string($data['body'])
        ) {
            return self::json($response, ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Body is required'], 400);
        }

        try {
            $result = CommentService::create((int)$idParam, $data['body']);
            return self::json($response, $result, 201);
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
