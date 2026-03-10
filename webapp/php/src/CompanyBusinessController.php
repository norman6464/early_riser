<?php

namespace App;

use App\Service\CompanyBusinessService;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 事業内容コントローラー
 *
 * 会社に紐づく事業内容のCRUD操作を担当
 */
class CompanyBusinessController
{
    /**
     * 事業内容一覧を取得する
     */
    public static function list(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyIdParam = (string)$args['companyId'];
        if (!ctype_digit($companyIdParam) || (int)$companyIdParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid company ID'], 400);
        }

        try {
            $businesses = CompanyBusinessService::listByCompanyId((int)$companyIdParam);
            return self::json($response, $businesses);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    /**
     * 事業内容を追加する
     */
    public static function add(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyIdParam = (string)$args['companyId'];
        if (!ctype_digit($companyIdParam) || (int)$companyIdParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid company ID'], 400);
        }

        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || !is_string($data['description'] ?? null)) {
            return self::json($response, ['code' => 'INVALID_REQUEST', 'message' => 'description is required'], 400);
        }

        try {
            $business = CompanyBusinessService::add((int)$companyIdParam, $data['description']);
            return self::json($response, $business, 201);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (PDOException) {
            return self::json($response, ['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error'], 500);
        }
    }

    /**
     * 事業内容を削除する
     */
    public static function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyIdParam = (string)$args['companyId'];
        $idParam = (string)$args['id'];

        if (!ctype_digit($companyIdParam) || (int)$companyIdParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid company ID'], 400);
        }
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            return self::json($response, ['code' => 'INVALID_ID', 'message' => 'Invalid ID'], 400);
        }

        try {
            CompanyBusinessService::delete((int)$idParam, (int)$companyIdParam);
            return self::json($response, ['message' => 'Deleted']);
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
