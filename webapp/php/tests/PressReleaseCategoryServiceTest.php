<?php

namespace Tests;

use App\Service\PressReleaseCategoryService;
use PHPUnit\Framework\TestCase;

/**
 * PressReleaseCategoryService のユニットテスト
 */
class PressReleaseCategoryServiceTest extends TestCase
{
    /**
     * getAll の戻り値が配列であること（DBモックなしの型チェック）
     * 実際のDB接続テストは統合テストで行う
     */
    public function testGetAllReturnsFormattedArray(): void
    {
        // サービス層のフォーマット関数をテスト
        $row = ['id' => '1', 'name' => '新商品'];
        $formatted = PressReleaseCategoryService::formatRow($row);

        $this->assertSame(1, $formatted['id']);
        $this->assertSame('新商品', $formatted['name']);
    }
}
