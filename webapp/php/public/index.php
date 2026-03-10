<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\GetPressReleaseController;
use App\SavePressReleaseController;
use App\ImageUploadController;
use App\TemplateController;
use App\OgpController;
use App\CompanyController;
use App\PressReleaseCategoryController;
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

$app->run();
