<?php

namespace Tests;

use App\Service\ProofreadService;
use App\Service\ServiceException;
use PHPUnit\Framework\TestCase;

/**
 * ProofreadService のユニットテスト
 */
class ProofreadServiceTest extends TestCase
{
    /**
     * タイトルと本文が両方空の場合バリデーションエラーになること
     */
    public function testProofreadThrowsExceptionWhenContentIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('Title or body is required');

        ProofreadService::proofread('', '');
    }

    /**
     * プロンプトにタイトルと本文が含まれること
     */
    public function testBuildPromptContainsTitleAndBody(): void
    {
        $prompt = ProofreadService::buildPrompt('テストタイトル', 'テスト本文');

        $this->assertStringContainsString('テストタイトル', $prompt);
        $this->assertStringContainsString('テスト本文', $prompt);
        $this->assertStringContainsString('JSON形式', $prompt);
    }
}
