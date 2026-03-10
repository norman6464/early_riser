<?php

namespace App;

use App\Helper\JsonResponder;
use App\Service\SectionGuideService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * AIセクションガイドコントローラー
 */
class SectionGuideController
{
    /**
     * セクション定義一覧を返す
     */
    public static function sections(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $sections = SectionGuideService::getSections();
        return JsonResponder::json($response, ['sections' => $sections]);
    }

    /**
     * 指定セクションの文章をAIで生成する
     */
    public static function generate(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = JsonResponder::parseJsonBody((string)$request->getBody());
        if ($data === null) {
            return JsonResponder::error($response, 'INVALID_JSON', 'Invalid JSON');
        }

        $sectionId = $data['section_id'] ?? '';
        $answers = $data['answers'] ?? [];
        $title = $data['title'] ?? '';

        if (!is_string($sectionId) || !is_array($answers) || !is_string($title)) {
            return JsonResponder::error($response, 'INVALID_REQUEST', 'Invalid request parameters');
        }

        $result = SectionGuideService::generate($sectionId, $answers, $title);
        return JsonResponder::json($response, $result);
    }
}
