<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\OgpService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * OGP情報取得コントローラー
 */
class OgpController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $url = $params['url'] ?? '';

        if (empty($url)) {
            return JsonResponder::error($response, 'MISSING_URL', 'URL parameter is required');
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return JsonResponder::error($response, 'INVALID_URL', 'Invalid URL format');
        }

        $data = OgpService::fetch($url);
        return JsonResponder::json($response, $data);
    }
}
