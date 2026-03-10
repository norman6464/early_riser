<?php

namespace App\Service;

use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * 会社のビジネスロジックを担当するサービス
 */
class CompanyService
{
    /**
     * 会社をIDで取得する（事業内容含む）
     *
     * @return array 整形済み会社データ
     * @throws ServiceException 会社が見つからない場合
     */
    public static function getById(int $id): array
    {
        $row = CompanyRepository::findById($id);
        if ($row === null) {
            throw ServiceException::notFound('Company not found');
        }

        $businesses = CompanyBusinessRepository::findByCompanyId($id);

        return self::formatRow($row, $businesses);
    }

    /**
     * 会社を新規作成する
     *
     * @return array 作成された会社データ
     * @throws ServiceException バリデーションエラー時
     */
    public static function create(string $name, string $location, ?int $employeeCount, string $appeal, string $challenge): array
    {
        self::validate($name, $location);

        $row = CompanyRepository::create($name, $location, $employeeCount, $appeal, $challenge);

        return self::formatRow($row, []);
    }

    /**
     * 会社を更新する
     *
     * @return array 更新された会社データ
     * @throws ServiceException バリデーションエラー、会社が見つからない場合
     */
    public static function update(int $id, string $name, string $location, ?int $employeeCount, string $appeal, string $challenge): array
    {
        self::validate($name, $location);

        $row = CompanyRepository::update($id, $name, $location, $employeeCount, $appeal, $challenge);
        if ($row === null) {
            throw ServiceException::notFound('Company not found');
        }

        $businesses = CompanyBusinessRepository::findByCompanyId($id);

        return self::formatRow($row, $businesses);
    }

    /**
     * バリデーション
     *
     * @throws ServiceException バリデーションエラー時
     */
    private static function validate(string $name, string $location): void
    {
        if (empty($name)) {
            throw ServiceException::validation('INVALID_REQUEST', 'name is required');
        }
        if (empty($location)) {
            throw ServiceException::validation('INVALID_REQUEST', 'location is required');
        }
    }

    /**
     * DBの行データをAPIレスポンス形式に整形する
     */
    public static function formatRow(array $row, array $businesses): array
    {
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'location' => $row['location'],
            'employee_count' => $row['employee_count'] !== null ? (int)$row['employee_count'] : null,
            'appeal' => $row['appeal'],
            'challenge' => $row['challenge'],
            'businesses' => array_map(fn(array $b) => [
                'id' => (int)$b['id'],
                'description' => $b['description'],
                'created_at' => $b['created_at'],
            ], $businesses),
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }
}
