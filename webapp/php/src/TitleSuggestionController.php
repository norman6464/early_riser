<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\TitleSuggestionService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * AIタイトル提案コントローラー
 */
class TitleSuggestionController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        $body = $data['body'] ?? '';
        $currentTitle = $data['current_title'] ?? '';

        if (!is_string($body) || !is_string($currentTitle)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'body must be a string');
        }

        $titles = TitleSuggestionService::suggest($body, $currentTitle);
        return JsonResponder::json($response, ['titles' => $titles]);
    }
}
