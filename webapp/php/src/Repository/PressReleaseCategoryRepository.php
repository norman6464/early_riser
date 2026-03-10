<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * プレスリリースカテゴリのDB操作を担当するリポジトリ
 */
class PressReleaseCategoryRepository
{
    /**
     * 全カテゴリを取得する
     *
     * @return array カテゴリ一覧
     */
    public static function findAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, name FROM press_release_categories ORDER BY id ASC');

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
