<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\PressReleaseService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリース取得コントローラー
 */
class GetPressReleaseController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $data = PressReleaseService::getById($id);
        return JsonResponder::json($response, $data);
    }
}
