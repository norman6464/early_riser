<?php

// PHP WarningがCORSヘッダー付加前に出力されるのを防ぐ
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/../vendor/autoload.php';

use App\GetPressReleaseController;
use App\SavePressReleaseController;
use App\SaveCommentController;
use App\GetCommentController;
use App\ImageUploadController;
use App\TemplateController;
use App\OgpController;
use App\CompanyController;
use App\PressReleaseCategoryController;
use App\ProofreadController;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

$app = AppFactory::create();

// Health check for ALB
$app->get('/', function (ServerRequestInterface $request, ResponseInterface $response) {
    $response->getBody()->write(json_encode(['status' => 'ok']));
    return $response->withHeader('Content-Type', 'application/json');
});

// Define routes
$app->get('/api/press-releases/{id}', GetPressReleaseController::class . '::handle');
$app->post('/api/press-releases/{id}', SavePressReleaseController::class . '::handle');
$app->get('/press-releases/{id}', GetPressReleaseController::class . '::handle');
$app->post('/press-releases/{id}', SavePressReleaseController::class . '::handle');

$app->get('/api/comments/{id}', GetCommentController::class . '::handle');
$app->post('/api/comments/{id}', SaveCommentController::class . '::handle');
$app->get('/comments/{id}', GetCommentController::class . '::handle');
$app->post('/comments/{id}', SaveCommentController::class . '::handle');

$app->post('/api/images/presigned-url', ImageUploadController::class . '::handle');

$app->get('/api/templates', TemplateController::class . '::list');
$app->post('/api/templates', TemplateController::class . '::save');
$app->delete('/api/templates/{id}', TemplateController::class . '::delete');

$app->get('/api/ogp', OgpController::class . '::handle');

// 会社API
$app->post('/api/companies', CompanyController::class . '::create');
$app->get('/api/companies/{id}', CompanyController::class . '::get');
$app->put('/api/companies/{id}', CompanyController::class . '::update');

// カテゴリAPI
$app->get('/api/press-release-categories', PressReleaseCategoryController::class . '::list');

// 誤字修正API
$app->post('/api/proofread', ProofreadController::class . '::handle');

// Catch-all for undefined routes (return 404 instead of 405)
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function (ServerRequestInterface $request, ResponseInterface $response) {
    $response->getBody()->write(json_encode(['code' => 'NOT_FOUND', 'message' => 'Route not found']));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
});

$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

// CORS + OPTIONS middleware - outermost (Slim LIFO: last added = first executed)
// Handles OPTIONS preflight directly without routing, and adds CORS headers to all responses
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
