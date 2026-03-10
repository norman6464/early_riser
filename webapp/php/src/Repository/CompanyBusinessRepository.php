<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * 事業内容のDB操作を担当するリポジトリ
 */
class CompanyBusinessRepository
{
    /**
     * 会社IDで事業内容一覧を取得する
     *
     * @return array 事業内容一覧
     */
    public static function findByCompanyId(int $companyId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, company_id, description, created_at FROM company_businesses WHERE company_id = :company_id ORDER BY id ASC');
        $stmt->execute(['company_id' => $companyId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * 事業内容を追加する
     *
     * @return array 作成されたレコード
     */
    public static function create(int $companyId, string $description): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO company_businesses (company_id, description)
             VALUES (:company_id, :description)
             RETURNING id, company_id, description, created_at'
        );
        $stmt->execute([
            'company_id' => $companyId,
            'description' => $description,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * 会社IDに紐づく事業内容を全削除する
     */
    public static function deleteByCompanyId(int $companyId): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM company_businesses WHERE company_id = :company_id');
        $stmt->execute(['company_id' => $companyId]);
    }
}
