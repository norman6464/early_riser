<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * テンプレートのDB操作を担当するリポジトリ
 */
class TemplateRepository
{
    /**
     * 全テンプレートを作成日時の降順で取得する
     *
     * @return array テンプレート一覧
     */
    public static function findAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, name, title, content, created_at FROM templates ORDER BY created_at DESC');

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * テンプレートを新規作成する
     *
     * @return array 作成されたレコード
     */
    public static function create(string $name, string $title, string $content): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO templates (name, title, content) VALUES (:name, :title, :content) RETURNING id, name, title, content, created_at'
        );
        $stmt->execute(['name' => $name, 'title' => $title, 'content' => $content]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * テンプレートを削除する
     *
     * @return bool 削除できた場合true
     */
    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM templates WHERE id = :id');
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }
}
