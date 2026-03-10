<?php

// PHP WarningがCORSヘッダー付加前に出力されるのを防ぐ
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/../vendor/autoload.php';

use App\CompanyController;
use App\GetCommentController;
use App\GetPressReleaseController;
use App\Helper\JsonResponder;
use App\ImageUploadController;
use App\Middleware\ErrorHandlerMiddleware;
use App\OgpController;
use App\PressReleaseCategoryController;
use App\ProofreadController;
use App\AiGenerateController;
use App\SaveCommentController;
use App\SavePressReleaseController;
use App\TemplateController;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

$app = AppFactory::create();

// ── ヘルスチェック ──
$app->get('/', function (ServerRequestInterface $request, ResponseInterface $response) {
    return JsonResponder::json($response, ['status' => 'ok']);
});

// ── プレスリリース ──
$app->get('/api/press-releases/{id}', GetPressReleaseController::class . '::handle');
$app->post('/api/press-releases/{id}', SavePressReleaseController::class . '::handle');

// ── コメント ──
$app->get('/api/comments/{id}', GetCommentController::class . '::handle');
$app->post('/api/comments/{id}', SaveCommentController::class . '::handle');

// ── 画像 ──
$app->post('/api/images/presigned-url', ImageUploadController::class . '::handle');

// ── テンプレート ──
$app->get('/api/templates', TemplateController::class . '::list');
$app->post('/api/templates', TemplateController::class . '::save');
$app->delete('/api/templates/{id}', TemplateController::class . '::delete');

// ── OGP ──
$app->get('/api/ogp', OgpController::class . '::handle');

// ── 会社 ──
$app->post('/api/companies', CompanyController::class . '::create');
$app->get('/api/companies/{id}', CompanyController::class . '::get');
$app->put('/api/companies/{id}', CompanyController::class . '::update');

// ── カテゴリ ──
$app->get('/api/press-release-categories', PressReleaseCategoryController::class . '::list');

// ── 誤字修正 ──
$app->post('/api/proofread', ProofreadController::class . '::handle');

// AI生成API
$app->post('/api/ai/generate', AiGenerateController::class . '::handle');

// Catch-all for undefined routes (return 404 instead of 405)
// ── 404 Catch-all ──
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function (ServerRequestInterface $request, ResponseInterface $response) {
    return JsonResponder::error($response, 'NOT_FOUND', 'Route not found', 404);
});

// ミドルウェア（Slim LIFO: 下から順に実行）
$app->addRoutingMiddleware();
$app->add(new ErrorHandlerMiddleware());

// CORS + OPTIONS ミドルウェア（最外層）
$app->add(function (ServerRequestInterface $request, $handler) {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new Response();
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
            ->withStatus(200);
    }

    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
});

// バッファに溜まったPHP Warning等を破棄してからSlimのレスポンスを出力
ob_end_clean();
$app->run();
