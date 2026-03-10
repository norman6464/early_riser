<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * 会社のDB操作を担当するリポジトリ
 */
class CompanyRepository
{
    /**
     * IDで会社を取得する
     *
     * @return array|null 会社データ、見つからない場合null
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, location, employee_count, appeal, challenge, created_at, updated_at FROM companies WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * 会社を新規作成する
     *
     * @return array 作成されたレコード
     */
    public static function create(string $name, string $location, ?int $employeeCount, string $appeal, string $challenge): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO companies (name, location, employee_count, appeal, challenge)
             VALUES (:name, :location, :employee_count, :appeal, :challenge)
             RETURNING id, name, location, employee_count, appeal, challenge, created_at, updated_at'
        );
        $stmt->execute([
            'name' => $name,
            'location' => $location,
            'employee_count' => $employeeCount,
            'appeal' => $appeal,
            'challenge' => $challenge,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * 会社を更新する
     *
     * @return array|null 更新されたレコード、見つからない場合null
     */
    public static function update(int $id, string $name, string $location, ?int $employeeCount, string $appeal, string $challenge): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'UPDATE companies SET name = :name, location = :location, employee_count = :employee_count,
             appeal = :appeal, challenge = :challenge, updated_at = CURRENT_TIMESTAMP
             WHERE id = :id
             RETURNING id, name, location, employee_count, appeal, challenge, created_at, updated_at'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'location' => $location,
            'employee_count' => $employeeCount,
            'appeal' => $appeal,
            'challenge' => $challenge,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }
}
