<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\GetPressReleaseController;
use App\SavePressReleaseController;
use App\ImageUploadController;
use App\TemplateController;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

$app = AppFactory::create();

// Handle OPTIONS preflight requests before routing
$app->options('/{routes:.*}', function (ServerRequestInterface $request, ResponseInterface $response) {
    return $response;
});

// Add CORS middleware
$app->add(function (ServerRequestInterface $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
});

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

// Catch-all for undefined routes (return 404 instead of 405)
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function (ServerRequestInterface $request, ResponseInterface $response) {
    $response->getBody()->write(json_encode(['code' => 'NOT_FOUND', 'message' => 'Route not found']));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
});

$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

$app->run();
