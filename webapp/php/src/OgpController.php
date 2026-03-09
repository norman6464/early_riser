<?php

namespace App;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * OGP情報取得コントローラー
 *
 * GET /api/ogp?url=... エンドポイントの処理を担当
 */
class OgpController
{
    public static function handle(
        ServerRequestInterface $request,
        ResponseInterface $response
    ): ResponseInterface
    {
        $params = $request->getQueryParams();
        $url = $params['url'] ?? '';

        if (empty($url)) {
            $payload = json_encode(['code' => 'MISSING_URL', 'message' => 'URL parameter is required']);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            $payload = json_encode(['code' => 'INVALID_URL', 'message' => 'Invalid URL format']);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $context = stream_context_create([
                'http' => [
                    'header' => "User-Agent: bot\r\n",
                    'timeout' => 5,
                ],
            ]);

            $html = @file_get_contents($url, false, $context);

            if ($html === false) {
                $payload = json_encode(['code' => 'FETCH_FAILED', 'message' => 'Failed to fetch URL']);
                $response->getBody()->write($payload);
                return $response->withHeader('Content-Type', 'application/json')->withStatus(502);
            }

            $title = self::getMetaContent($html, 'og:title')
                ?: self::getMetaContent($html, 'twitter:title')
                ?: self::getTitleTag($html);

            $description = self::getMetaContent($html, 'og:description')
                ?: self::getMetaContent($html, 'twitter:description')
                ?: self::getMetaContent($html, 'description');

            $image = self::getMetaContent($html, 'og:image')
                ?: self::getMetaContent($html, 'twitter:image');

            if ($image && !str_starts_with($image, 'http')) {
                $parsed = parse_url($url);
                $base = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
                if (str_starts_with($image, '/')) {
                    $image = $base . $image;
                } else {
                    $image = $base . '/' . $image;
                }
            }

            $payload = json_encode([
                'url' => $url,
                'title' => $title,
                'description' => $description,
                'image' => $image,
            ]);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Throwable $e) {
            $payload = json_encode(['code' => 'FETCH_ERROR', 'message' => 'Failed to fetch OGP data']);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(502);
        }
    }

    private static function getMetaContent(string $html, string $property): string
    {
        if (preg_match('/<meta[^>]+(?:property|name)=["\x27]' . preg_quote($property, '/') . '["\x27][^>]+content=["\x27]([^"\x27]*)["\x27]/', $html, $match)) {
            return $match[1];
        }
        if (preg_match('/<meta[^>]+content=["\x27]([^"\x27]*)["\x27][^>]+(?:property|name)=["\x27]' . preg_quote($property, '/') . '["\x27]/', $html, $match)) {
            return $match[1];
        }
        return '';
    }

    private static function getTitleTag(string $html): string
    {
        if (preg_match('/<title[^>]*>([^<]*)<\/title>/i', $html, $match)) {
            return $match[1];
        }
        return '';
    }
}
