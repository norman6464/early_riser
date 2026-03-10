<?php

namespace App\Service;

use App\Repository\PressReleaseRepository;
use DateTimeImmutable;

/**
 * プレスリリースのビジネスロジックを担当するサービス
 */
class PressReleaseService
{
    private const TITLE_MAX_LENGTH = 100;
    private const BODY_MAX_LENGTH = 500;

    /**
     * IDでプレスリリースを取得する
     *
     * @return array レスポンス用に整形済みのデータ
     * @throws ServiceException プレスリリースが見つからない場合
     */
    public static function getById(int $id): array
    {
        $row = PressReleaseRepository::findById($id);

        if ($row === null) {
            throw ServiceException::notFound('Press release not found');
        }

        return self::formatRow($row);
    }

    /**
     * プレスリリースを更新する
     *
     * @return array レスポンス用に整形済みのデータ
     * @throws ServiceException バリデーションエラーまたは見つからない場合
     */
    public static function update(int $id, string $title, string $content): array
    {
        // バリデーション
        self::validate($title, $content);

        // 存在確認
        if (!PressReleaseRepository::exists($id)) {
            throw ServiceException::notFound('Press release not found');
        }

        // 更新
        $row = PressReleaseRepository::update($id, $title, $content);

        return self::formatRow($row);
    }

    /**
     * タイトルと本文のバリデーション
     *
     * @throws ServiceException バリデーションエラー時
     */
    private static function validate(string $title, string $content): void
    {
        $titleLen = mb_strlen($title);
        $contentLen = mb_strlen(self::extractText(json_decode($content, true)));

        $errors = [];
        if ($titleLen > self::TITLE_MAX_LENGTH) {
            $errors[] = 'title must be at most ' . self::TITLE_MAX_LENGTH . ' characters';
        }
        if ($contentLen > self::BODY_MAX_LENGTH) {
            $errors[] = 'content must be at most ' . self::BODY_MAX_LENGTH . ' characters';
        }

        if (!empty($errors)) {
            throw ServiceException::validation('TOO_LONG', implode('; ', $errors));
        }
    }

    /**
     * TipTap JSONからテキストを再帰的に抽出する
     */
    private static function extractText(?array $node): string
    {
        if ($node === null) {
            return '';
        }

        $text = '';
        if (isset($node['type']) && $node['type'] === 'text' && isset($node['text'])) {
            $text .= $node['text'];
        }
        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $child) {
                if (is_array($child)) {
                    $text .= self::extractText($child);
                }
            }
        }
        return $text;
    }

    /**
     * DBレコードをレスポンス形式に整形する
     */
    private static function formatRow(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'created_at' => (new DateTimeImmutable($row['created_at']))->format('Y-m-d\TH:i:s.u'),
            'updated_at' => (new DateTimeImmutable($row['updated_at']))->format('Y-m-d\TH:i:s.u'),
        ];
    }
}
