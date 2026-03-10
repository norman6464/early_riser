<?php

namespace App;

use App\Service\OgpService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * OGP情報取得コントローラー
 *
 * GET /api/ogp?url=... エンドポイントの処理を担当
 */
class OgpController
{
    public static function handle(
        ServerRequestInterface $request,
        ResponseInterface $response
    ): ResponseInterface {
        $params = $request->getQueryParams();
        $url = $params['url'] ?? '';

        if (empty($url)) {
            return self::json($response, ['code' => 'MISSING_URL', 'message' => 'URL parameter is required'], 400);
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return self::json($response, ['code' => 'INVALID_URL', 'message' => 'Invalid URL format'], 400);
        }

        try {
            $data = OgpService::fetch($url);
            return self::json($response, $data);
        } catch (ServiceException $e) {
            return self::json($response, ['code' => $e->getErrorCode(), 'message' => $e->getMessage()], $e->getStatusCode());
        } catch (\Throwable) {
            return self::json($response, ['code' => 'FETCH_ERROR', 'message' => 'Failed to fetch OGP data'], 502);
        }
    }

    private static function json(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
