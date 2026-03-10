<?php

namespace App\Service;

use App\Repository\CompanyRepository;
use App\Repository\CompanyBusinessRepository;

/**
 * 事業内容のビジネスロジックを担当するサービス
 */
class CompanyBusinessService
{
    /**
     * 事業内容を追加する
     *
     * @return array 作成された事業内容データ
     * @throws ServiceException バリデーションエラー、会社が見つからない場合
     */
    public static function add(int $companyId, string $description): array
    {
        if (empty($description)) {
            throw ServiceException::validation('INVALID_REQUEST', 'description is required');
        }

        // 会社の存在チェック
        $company = CompanyRepository::findById($companyId);
        if ($company === null) {
            throw ServiceException::notFound('Company not found');
        }

        $row = CompanyBusinessRepository::create($companyId, $description);

        return [
            'id' => (int)$row['id'],
            'company_id' => (int)$row['company_id'],
            'description' => $row['description'],
            'created_at' => $row['created_at'],
        ];
    }

    /**
     * 事業内容を削除する
     *
     * @throws ServiceException 事業内容が見つからない場合
     */
    public static function delete(int $id, int $companyId): void
    {
        $deleted = CompanyBusinessRepository::delete($id, $companyId);

        if (!$deleted) {
            throw ServiceException::notFound('Business not found');
        }
    }

    /**
     * 会社の事業内容一覧を取得する
     *
     * @return array 事業内容一覧
     */
    public static function listByCompanyId(int $companyId): array
    {
        // 会社の存在チェック
        $company = CompanyRepository::findById($companyId);
        if ($company === null) {
            throw ServiceException::notFound('Company not found');
        }

        $rows = CompanyBusinessRepository::findByCompanyId($companyId);

        return array_map(fn(array $row) => [
            'id' => (int)$row['id'],
            'company_id' => (int)$row['company_id'],
            'description' => $row['description'],
            'created_at' => $row['created_at'],
        ], $rows);
    }
}
