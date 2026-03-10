<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\ProofreadService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 誤字修正コントローラー
 */
class ProofreadController
{
    public static function handle(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        $title = $data['title'] ?? '';
        $bodyText = $data['body'] ?? '';

        if (!is_string($title) || !is_string($bodyText)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'title and body must be strings');
        }

        $result = ProofreadService::proofread($title, $bodyText);
        return JsonResponder::json($response, [
            'original_title' => $title,
            'original_body' => $bodyText,
            'corrected_title' => $result['title'],
            'corrected_body' => $result['body'],
        ]);
    }
}
