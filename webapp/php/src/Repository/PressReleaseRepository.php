<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * プレスリリースのDB操作を担当するリポジトリ
 */
class PressReleaseRepository
{
    /**
     * IDでプレスリリースを取得する
     *
     * @return array|null 取得結果（存在しない場合はnull）
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, title, content, created_at, updated_at FROM press_releases WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * IDでプレスリリースの存在確認をする
     */
    public static function exists(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id FROM press_releases WHERE id = :id');
        $stmt->execute(['id' => $id]);

        return (bool)$stmt->fetch();
    }

    /**
     * プレスリリースを更新する
     *
     * @return array 更新後のレコード
     */
    public static function update(int $id, string $title, string $content): array
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('
            UPDATE press_releases
            SET title = :title, content = :content, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $stmt->execute([
            'id' => $id,
            'title' => $title,
            'content' => $content,
        ]);

        return self::findById($id);
    }
}
