<?php

namespace Tests;

use App\Service\CompanyBusinessService;
use App\Service\ServiceException;
use PHPUnit\Framework\TestCase;

/**
 * CompanyBusinessService のユニットテスト
 */
class CompanyBusinessServiceTest extends TestCase
{
    /**
     * 事業内容追加時にdescriptionが空ならバリデーションエラーになること
     */
    public function testAddThrowsExceptionWhenDescriptionIsEmpty(): void
    {
        $this->expectException(ServiceException::class);
        $this->expectExceptionMessage('description is required');

        CompanyBusinessService::add(1, '');
    }
}
