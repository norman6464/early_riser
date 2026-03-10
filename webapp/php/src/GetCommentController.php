<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\CommentService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * コメント取得コントローラー
 */
class GetCommentController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $comments = CommentService::getByPressReleaseId($id);
        return JsonResponder::json($response, ['comments' => $comments]);
    }
}
