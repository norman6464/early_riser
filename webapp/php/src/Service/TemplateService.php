<?php

namespace App\Service;

use App\Repository\TemplateRepository;

/**
 * テンプレートのビジネスロジックを担当するサービス
 */
class TemplateService
{
    /**
     * 全テンプレートを取得する
     *
     * @return array 整形済みテンプレート一覧
     */
    public static function getAll(): array
    {
        $rows = TemplateRepository::findAll();

        return array_map(fn(array $row) => [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'title' => $row['title'],
            'content' => $row['content'],
            'created_at' => $row['created_at'],
        ], $rows);
    }

    /**
     * テンプレートを新規作成する
     *
     * @return array 作成されたテンプレート
     * @throws ServiceException バリデーションエラー時
     */
    public static function create(string $name, string $title, string $content): array
    {
        if (empty($name)) {
            throw ServiceException::validation('INVALID_REQUEST', 'name is required');
        }

        $row = TemplateRepository::create($name, $title, $content);

        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'title' => $row['title'],
            'content' => $row['content'],
            'created_at' => $row['created_at'],
        ];
    }

    /**
     * テンプレートを削除する
     *
     * @throws ServiceException テンプレートが見つからない場合
     */
    public static function delete(int $id): void
    {
        $deleted = TemplateRepository::delete($id);

        if (!$deleted) {
            throw ServiceException::notFound('Template not found');
        }
    }
}
