<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\ToneAnalysisService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * AI文章トーン分析コントローラー
 */
class ToneAnalysisController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        $title = $data['title'] ?? '';
        $body = $data['body'] ?? '';

        if (!is_string($title) || !is_string($body)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'title and body must be strings');
        }

        $result = ToneAnalysisService::analyze($title, $body);
        return JsonResponder::json($response, $result);
    }
}
