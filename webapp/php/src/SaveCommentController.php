<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\CommentService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * コメント保存コントローラー
 */
class SaveCommentController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        if (!is_string($data['body'] ?? null)) {
            return JsonResponder::error($response, 'MISSING_REQUIRED_FIELDS', 'Body is required');
        }

        $result = CommentService::create($id, $data['body']);
        return JsonResponder::json($response, $result, 201);
    }
}
