<?php

namespace App\Service;

use App\Repository\PressReleaseRepository;
use App\Repository\CompanyRepository;
use Aws\S3\S3Client;

/**
 * プレスリリース公開サービス
 * プレスリリースをHTMLに変換してS3に公開し、CloudFront経由で配信する
 */
class PublishService
{
    private const PUBLIC_BUCKET = 'early-riser-public-726725835302';
    private const CLOUDFRONT_DOMAIN = 'd3ouxk9k9sbb2.cloudfront.net';

    /**
     * プレスリリースを公開する
     *
     * @return array ['url' => '公開URL', 'published_at' => '公開日時']
     */
    public static function publish(int $pressReleaseId): array
    {
        $pr = PressReleaseRepository::findById($pressReleaseId);
        if (!$pr) {
            throw ServiceException::validation('NOT_FOUND', 'プレスリリースが見つかりません');
        }

        if (empty(trim($pr['title']))) {
            throw ServiceException::validation('EMPTY_TITLE', 'タイトルが入力されていません');
        }

        $company = null;
        if (!empty($pr['company_id'])) {
            $company = CompanyRepository::findById((int)$pr['company_id']);
        }

        // TipTapのJSON形式をHTMLに変換
        $bodyHtml = self::convertContentToHtml($pr['content']);
        $html = self::buildPublicHtml($pr['title'], $bodyHtml, $company);

        // S3にアップロード
        $key = "releases/{$pressReleaseId}/index.html";
        $region = getenv('AWS_REGION') ?: 'ap-northeast-1';

        $s3 = new S3Client([
            'region' => $region,
            'version' => 'latest',
        ]);

        $s3->putObject([
            'Bucket' => self::PUBLIC_BUCKET,
            'Key' => $key,
            'Body' => $html,
            'ContentType' => 'text/html; charset=utf-8',
            'CacheControl' => 'public, max-age=300',
        ]);

        $url = 'https://' . self::CLOUDFRONT_DOMAIN . '/' . $key;
        $publishedAt = date('Y-m-d\TH:i:sP');

        return [
            'url' => $url,
            'published_at' => $publishedAt,
        ];
    }

    /**
     * TipTapのJSONコンテンツをHTMLに変換する
     */
    private static function convertContentToHtml(string $content): string
    {
        $doc = json_decode($content, true);
        if (!is_array($doc) || !isset($doc['content'])) {
            // JSONでなければプレーンテキストとして扱う
            return '<p>' . nl2br(htmlspecialchars($content, ENT_QUOTES, 'UTF-8')) . '</p>';
        }

        return self::renderNodes($doc['content']);
    }

    /**
     * TipTapのノード配列をHTMLに変換する
     */
    private static function renderNodes(array $nodes): string
    {
        $html = '';
        foreach ($nodes as $node) {
            $html .= self::renderNode($node);
        }
        return $html;
    }

    /**
     * 単一ノードをHTMLに変換する
     */
    private static function renderNode(array $node): string
    {
        $type = $node['type'] ?? '';
        $content = isset($node['content']) ? self::renderNodes($node['content']) : '';
        $attrs = $node['attrs'] ?? [];

        return match ($type) {
            'paragraph' => "<p>{$content}</p>\n",
            'heading' => self::renderHeading($node, $content),
            'image' => self::renderImage($attrs),
            'bulletList' => "<ul>\n{$content}</ul>\n",
            'orderedList' => "<ol>\n{$content}</ol>\n",
            'listItem' => "<li>{$content}</li>\n",
            'blockquote' => "<blockquote>{$content}</blockquote>\n",
            'horizontalRule' => "<hr>\n",
            'text' => self::renderText($node),
            'hardBreak' => "<br>\n",
            default => $content,
        };
    }

    /**
     * 見出しノードをHTMLに変換する
     */
    private static function renderHeading(array $node, string $content): string
    {
        $level = $node['attrs']['level'] ?? 2;
        $level = max(1, min(6, $level));
        return "<h{$level}>{$content}</h{$level}>\n";
    }

    /**
     * 画像ノードをHTMLに変換する
     */
    private static function renderImage(array $attrs): string
    {
        $src = htmlspecialchars($attrs['src'] ?? '', ENT_QUOTES, 'UTF-8');
        $alt = htmlspecialchars($attrs['alt'] ?? '', ENT_QUOTES, 'UTF-8');

        $style = '';
        if (!empty($attrs['width'])) {
            $style .= "width:{$attrs['width']}px;";
        }
        if (!empty($attrs['height'])) {
            $style .= "height:{$attrs['height']}px;";
        }

        $styleAttr = $style ? " style=\"{$style}\"" : '';
        return "<img src=\"{$src}\" alt=\"{$alt}\"{$styleAttr} loading=\"lazy\">\n";
    }

    /**
     * テキストノードをHTMLに変換する（マーク付き）
     */
    private static function renderText(array $node): string
    {
        $text = htmlspecialchars($node['text'] ?? '', ENT_QUOTES, 'UTF-8');
        $marks = $node['marks'] ?? [];

        foreach ($marks as $mark) {
            $markType = $mark['type'] ?? '';
            $text = match ($markType) {
                'bold' => "<strong>{$text}</strong>",
                'italic' => "<em>{$text}</em>",
                'underline' => "<u>{$text}</u>",
                'link' => '<a href="' . htmlspecialchars($mark['attrs']['href'] ?? '', ENT_QUOTES, 'UTF-8') . '" target="_blank" rel="noopener">' . $text . '</a>',
                default => $text,
            };
        }

        return $text;
    }

    /**
     * 公開用HTMLページを構築する
     */
    private static function buildPublicHtml(string $title, string $bodyHtml, ?array $company): string
    {
        $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $companyName = $company ? htmlspecialchars($company['name'] ?? '', ENT_QUOTES, 'UTF-8') : '';
        $publishDate = date('Y年n月j日');

        $companySection = '';
        if ($company) {
            $companySection = '<footer class="company-info">';
            $companySection .= '<h3>会社概要</h3>';
            $companySection .= '<table>';
            if (!empty($company['name'])) {
                $companySection .= '<tr><th>会社名</th><td>' . htmlspecialchars($company['name'], ENT_QUOTES, 'UTF-8') . '</td></tr>';
            }
            if (!empty($company['location'])) {
                $companySection .= '<tr><th>所在地</th><td>' . htmlspecialchars($company['location'], ENT_QUOTES, 'UTF-8') . '</td></tr>';
            }
            if (!empty($company['employee_count'])) {
                $companySection .= '<tr><th>従業員数</th><td>' . htmlspecialchars((string)$company['employee_count'], ENT_QUOTES, 'UTF-8') . '名</td></tr>';
            }
            $companySection .= '</table>';
            $companySection .= '</footer>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$escapedTitle}</title>
<meta property="og:title" content="{$escapedTitle}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif;
    color: #1a1a1a;
    line-height: 1.8;
    background: #f5f5f5;
  }
  .container {
    max-width: 720px;
    margin: 2rem auto;
    background: white;
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .meta .company-name { font-weight: 600; }
  h1 { font-size: 1.75rem; line-height: 1.4; margin-bottom: 1.5rem; border-bottom: 2px solid #2563eb; padding-bottom: 0.75rem; }
  h2 { font-size: 1.375rem; margin: 2rem 0 1rem; }
  h3 { font-size: 1.125rem; margin: 1.5rem 0 0.75rem; }
  p { margin-bottom: 1rem; }
  img { max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0; }
  ul, ol { margin: 1rem 0 1rem 2rem; }
  li { margin-bottom: 0.5rem; }
  blockquote { border-left: 4px solid #2563eb; padding: 0.75rem 1.5rem; margin: 1rem 0; background: #f8fafc; }
  a { color: #2563eb; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
  .company-info { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; }
  .company-info h3 { font-size: 1rem; color: #666; }
  .company-info table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
  .company-info th { text-align: left; font-weight: 600; padding: 0.5rem 1rem 0.5rem 0; width: 100px; font-size: 0.875rem; color: #555; vertical-align: top; }
  .company-info td { padding: 0.5rem 0; font-size: 0.875rem; }
  .powered-by { text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #999; }
</style>
</head>
<body>
<article class="container">
  <div class="meta">
    <span class="date">{$publishDate}</span>
    {$companyName}
  </div>
  <h1>{$escapedTitle}</h1>
  <div class="body">
    {$bodyHtml}
  </div>
  {$companySection}
</article>
<div class="powered-by">Powered by Early Riser Press Release Editor</div>
</body>
</html>
HTML;
    }
}
