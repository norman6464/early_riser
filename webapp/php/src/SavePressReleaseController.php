<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\PressReleaseService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * プレスリリース保存コントローラー
 */
class SavePressReleaseController
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

        if (!is_string($data['title'] ?? null) || !is_string($data['content'] ?? null)) {
            return JsonResponder::error($response, 'MISSING_REQUIRED_FIELDS', 'Title and content are required');
        }

        $result = PressReleaseService::update(
            $id,
            $data['title'],
            $data['content'],
            isset($data['company_id']) ? (int)$data['company_id'] : null,
            isset($data['category_id']) ? (int)$data['category_id'] : null,
            $data['goal'] ?? ''
        );
        return JsonResponder::json($response, $result);
    }
}
