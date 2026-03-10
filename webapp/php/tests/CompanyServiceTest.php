<?php

namespace Tests;

use App\Service\CompanyService;
use App\Service\ServiceException;
use PHPUnit\Framework\TestCase;

/**
 * CompanyService のユニットテスト
 */
class CompanyServiceTest extends TestCase
{
    /**
     * 会社作成時にnameが空ならバリデーションエラーになること
     */
    public function testCreateThrowsExceptionWhenNameIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('name is required');

        CompanyService::create('', '東京都', null, '', '');
    }

    /**
     * 会社作成時にlocationが空ならバリデーションエラーになること
     */
    public function testCreateThrowsExceptionWhenLocationIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('location is required');

        CompanyService::create('株式会社テスト', '', null, '', '');
    }

    /**
     * 会社更新時にnameが空ならバリデーションエラーになること
     */
    public function testUpdateThrowsExceptionWhenNameIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('name is required');

        CompanyService::update(1, '', '東京都', null, '', '');
    }

    /**
     * 会社更新時にlocationが空ならバリデーションエラーになること
     */
    public function testUpdateThrowsExceptionWhenLocationIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('location is required');

        CompanyService::update(1, '株式会社テスト', '', null, '', '');
    }
}
