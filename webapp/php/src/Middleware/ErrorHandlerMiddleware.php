<?php

namespace App\Middleware;

use App\Helper\JsonResponder;
use App\Service\ServiceException;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

/**
 * 共通エラーハンドリングミドルウェア
 *
 * ServiceException と PDOException をキャッチし、統一的なJSONエラーレスポンスを返す
 */
class ErrorHandlerMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        try {
            return $handler->handle($request);
        } catch (ServiceException $e) {
            return JsonResponder::error(new Response(), $e->getErrorCode(), $e->getMessage(), $e->getStatusCode());
        } catch (PDOException) {
            return JsonResponder::error(new Response(), 'INTERNAL_ERROR', 'Internal server error', 500);
        }
    }
}
