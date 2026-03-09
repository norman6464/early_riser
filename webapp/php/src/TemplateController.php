<?php

namespace App;

use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class TemplateController
{
    public static function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->query('SELECT id, name, title, content, created_at FROM templates ORDER BY created_at DESC');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $templates = array_map(fn($row) => [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'title' => $row['title'],
                'content' => $row['content'],
                'created_at' => $row['created_at'],
            ], $rows);

            $response->getBody()->write(json_encode($templates));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (PDOException) {
            $response->getBody()->write(json_encode(['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public static function save(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (string)$request->getBody();
        $data = json_decode($body, true);

        if (!is_array($data) || empty($data['name']) || !is_string($data['name'])) {
            $response->getBody()->write(json_encode(['code' => 'INVALID_REQUEST', 'message' => 'name is required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $name = $data['name'];
        $title = $data['title'] ?? '';
        $content = $data['content'] ?? '';

        try {
            $db = Database::getConnection();
            $stmt = $db->prepare('INSERT INTO templates (name, title, content) VALUES (:name, :title, :content) RETURNING id, name, title, content, created_at');
            $stmt->execute(['name' => $name, 'title' => $title, 'content' => $content]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $template = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'title' => $row['title'],
                'content' => $row['content'],
                'created_at' => $row['created_at'],
            ];

            $response->getBody()->write(json_encode($template));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (PDOException) {
            $response->getBody()->write(json_encode(['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public static function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $idParam = (string)$args['id'];
        if (!ctype_digit($idParam) || (int)$idParam <= 0) {
            $response->getBody()->write(json_encode(['code' => 'INVALID_ID', 'message' => 'Invalid ID']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $db = Database::getConnection();
            $stmt = $db->prepare('DELETE FROM templates WHERE id = :id');
            $stmt->execute(['id' => (int)$idParam]);

            if ($stmt->rowCount() === 0) {
                $response->getBody()->write(json_encode(['code' => 'NOT_FOUND', 'message' => 'Template not found']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (PDOException) {
            $response->getBody()->write(json_encode(['code' => 'INTERNAL_ERROR', 'message' => 'Internal server error']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
