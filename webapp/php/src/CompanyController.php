<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\CompanyService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 会社コントローラー
 */
class CompanyController
{
    public static function get(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $company = CompanyService::getById($id);
        return JsonResponder::json($response, $company);
    }

    public static function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null || !is_string($data['name'] ?? null)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'name is required');
        }

        if (!is_string($data['location'] ?? null)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'location is required');
        }

        $company = CompanyService::create(
            $data['name'],
            $data['location'],
            isset($data['employee_count']) ? (int)$data['employee_count'] : null,
            $data['appeal'] ?? '',
            $data['challenge'] ?? '',
            is_array($data['businesses'] ?? null) ? $data['businesses'] : []
        );
        return JsonResponder::json($response, $company, 201);
    }

    public static function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null || !is_string($data['name'] ?? null)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'name is required');
        }

        if (!is_string($data['location'] ?? null)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'location is required');
        }

        $company = CompanyService::update(
            $id,
            $data['name'],
            $data['location'],
            isset($data['employee_count']) ? (int)$data['employee_count'] : null,
            $data['appeal'] ?? '',
            $data['challenge'] ?? '',
            is_array($data['businesses'] ?? null) ? $data['businesses'] : []
        );
        return JsonResponder::json($response, $company);
    }
}
