<?php

namespace App\Repository;

use App\Database;
use PDO;

/**
 * チャットメッセージのDB操作を担当するリポジトリ
 */
class ChatMessageRepository
{
    /**
     * メッセージを保存する
     */
    public static function create(int $pressReleaseId, string $role, string $content): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO chat_messages (press_release_id, role, content)
            VALUES (:press_release_id, :role, :content)
            RETURNING id, press_release_id, role, content, created_at
        ');
        $stmt->execute([
            'press_release_id' => $pressReleaseId,
            'role' => $role,
            'content' => $content,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * プレスリリースIDで履歴を取得する（直近N件）
     */
    public static function findByPressReleaseId(int $pressReleaseId, int $limit = 50): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT id, press_release_id, role, content, created_at
            FROM chat_messages
            WHERE press_release_id = :press_release_id
            ORDER BY created_at ASC
            LIMIT :limit
        ');
        $stmt->bindValue('press_release_id', $pressReleaseId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * OpenAIに渡す直近の会話履歴を取得する
     */
    public static function getRecentHistory(int $pressReleaseId, int $limit = 20): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT role, content
            FROM chat_messages
            WHERE press_release_id = :press_release_id
            ORDER BY created_at DESC
            LIMIT :limit
        ');
        $stmt->bindValue('press_release_id', $pressReleaseId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_reverse($rows);
    }
}
