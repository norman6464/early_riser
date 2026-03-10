<?php

namespace App\Repository;

use App\Database;
use PDO;

class CommentRepository
{
    public static function create(int $pressReleaseId, string $body): array
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('
            INSERT INTO comments (press_release_id, body)
            VALUES (:press_release_id, :body)
            RETURNING id, press_release_id, body, created_at, updated_at
        ');
        $stmt->execute([
            'press_release_id' => $pressReleaseId,
            'body' => $body,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
