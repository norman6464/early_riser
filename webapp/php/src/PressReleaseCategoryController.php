<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\PressReleaseCategoryService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリースカテゴリコントローラー
 */
class PressReleaseCategoryController
{
    public static function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $categories = PressReleaseCategoryService::getAll();
        return JsonResponder::json($response, $categories);
    }
}
