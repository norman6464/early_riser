<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\ChatService;
use App\Service\ServiceException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * AIチャットコントローラー
 */
class ChatController
{
    /**
     * チャット履歴を取得する
     * GET /api/chat/{id}/history
     */
    public static function history(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $messages = ChatService::getHistory($id);
        return JsonResponder::json($response, ['messages' => $messages]);
    }

    /**
     * AIチャット（SSEストリーミング）
     * POST /api/chat/{id}
     *
     * SSEはSlimのResponseを経由せず直接出力する
     */
    public static function stream(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = JsonResponder::parseId($args);
        if ($id === null) {
            return JsonResponder::error($response, 'INVALID_ID', 'Invalid ID');
        }

        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        if (!is_string($data['message'] ?? null) || empty(trim($data['message']))) {
            return JsonResponder::error($response, 'MISSING_MESSAGE', 'Message is required');
        }

        // SSEヘッダーを直接出力
        // Slimのレスポンスとは別にSSEストリームを書き出す
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Accept');

        // 出力バッファを全てクリア
        while (ob_get_level()) {
            ob_end_clean();
        }

        try {
            ChatService::streamChat($id, $data['message']);
        } catch (ServiceException $e) {
            echo "data: " . json_encode([
                'error' => true,
                'code' => $e->getErrorCode(),
                'message' => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE) . "\n\n";
            flush();
        } catch (\Exception $e) {
            echo "data: " . json_encode([
                'error' => true,
                'code' => 'INTERNAL_ERROR',
                'message' => 'An internal error occurred',
            ], JSON_UNESCAPED_UNICODE) . "\n\n";
            flush();
        }

        // SSEはレスポンスボディを直接書いたので、空のレスポンスを返す
        exit;
    }
}
