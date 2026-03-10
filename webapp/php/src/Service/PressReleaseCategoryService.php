<?php

namespace App\Service;

use App\Repository\PressReleaseCategoryRepository;

/**
 * プレスリリースカテゴリのビジネスロジックを担当するサービス
 */
class PressReleaseCategoryService
{
    /**
     * 全カテゴリを取得する
     *
     * @return array 整形済みカテゴリ一覧
     */
    public static function getAll(): array
    {
        $rows = PressReleaseCategoryRepository::findAll();

        return array_map(fn(array $row) => self::formatRow($row), $rows);
    }

    /**
     * DBの行データをAPIレスポンス形式に整形する
     */
    public static function formatRow(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
        ];
    }
}
