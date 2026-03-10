<?php

namespace App\Service;

/**
 * OGP情報取得のビジネスロジックを担当するサービス
 */
class OgpService
{
    /**
     * URLからOGP情報を取得する
     *
     * @return array OGP情報（url, title, description, image）
     * @throws ServiceException URL取得失敗時
     */
    public static function fetch(string $url): array
    {
        $context = stream_context_create([
            'http' => [
                'header' => "User-Agent: bot\r\n",
                'timeout' => 5,
            ],
        ]);

        $html = @file_get_contents($url, false, $context);

        if ($html === false) {
            throw ServiceException::external('FETCH_FAILED', 'Failed to fetch URL');
        }

        $title = self::getMetaContent($html, 'og:title')
            ?: self::getMetaContent($html, 'twitter:title')
            ?: self::getTitleTag($html);

        $description = self::getMetaContent($html, 'og:description')
            ?: self::getMetaContent($html, 'twitter:description')
            ?: self::getMetaContent($html, 'description');

        $image = self::getMetaContent($html, 'og:image')
            ?: self::getMetaContent($html, 'twitter:image');

        // 相対URLを絶対URLに変換する
        if ($image && !str_starts_with($image, 'http')) {
            $parsed = parse_url($url);
            $base = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            $image = str_starts_with($image, '/') ? $base . $image : $base . '/' . $image;
        }

        return [
            'url' => $url,
            'title' => $title,
            'description' => $description,
            'image' => $image,
        ];
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
