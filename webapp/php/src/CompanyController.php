<?php

namespace App;

use App\Service\CompanyService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 会社コントローラー
 *
 * 会社の作成・取得・更新を担当
 */
class CompanyController
{
    /**
     * 会社を取得する
     */
    public static function get(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        try {
            $company = CompanyService::getById((int)$idParam);
            return self::json($response, $company);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    /**
     * 会社を作成する
     */
    public static function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || !is_string($data['name'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'name is required'], 400);
        }

        if (!is_string($data['location'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'location is required'], 400);
        }

        try {
            $company = CompanyService::create(
                $data['name'],
                $data['location'],
                isset($data['employee_count']) ? (int)$data['employee_count'] : null,
                $data['appeal'] ?? '',
                $data['challenge'] ?? ''
            );
            return self::json($response, $company, 201);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    /**
     * 会社を更新する
     */
    public static function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || !is_string($data['name'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'name is required'], 400);
        }

        if (!is_string($data['location'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'location is required'], 400);
        }

        try {
            $company = CompanyService::update(
                (int)$idParam,
                $data['name'],
                $data['location'],
                isset($data['employee_count']) ? (int)$data['employee_count'] : null,
                $data['appeal'] ?? '',
                $data['challenge'] ?? ''
            );
            return self::json($response, $company);
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
