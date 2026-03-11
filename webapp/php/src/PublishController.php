<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\PublishService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリース公開コントローラー
 */
class PublishController
{
    /**
     * プレスリリースを公開する
     */
    public static function handle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int)($args['id'] ?? 0);
        if ($id <= 0) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid press release ID');
        }

        try {
            $result = PublishService::publish($id);
            return JsonResponder::json($response, $result);
        } catch (ServiceException $e) {
            return JsonResponder::error($response, $e->getErrorCode(), $e->getMessage());
        }
    }
}
