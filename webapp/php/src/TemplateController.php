<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\TemplateService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * テンプレートコントローラー
 */
class TemplateController
{
    public static function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $templates = TemplateService::getAll();
        return JsonResponder::json($response, $templates);
    }

    public static function save(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null || !is_string($data['name'] ?? null)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'name is required');
        }

        $template = TemplateService::create($data['name'], $data['title'] ?? '', $data['content'] ?? '');
        return JsonResponder::json($response, $template, 201);
    }

    public static function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        TemplateService::delete($id);
        return JsonResponder::json($response, ['message' => 'Deleted']);
    }
}
