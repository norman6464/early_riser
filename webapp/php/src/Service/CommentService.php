<?php

namespace App\Service;

use App\Repository\CommentRepository;
use App\Repository\PressReleaseRepository;

class CommentService
{
    private const BODY_MAX_LENGTH = 1000;

    public static function create(int $pressReleaseId, string $body): array
    {
        self::validate($body);

        if (!PressReleaseRepository::exists($pressReleaseId)) {
            throw ServiceException::notFound('Press release not found');
        }

        $row = CommentRepository::create($pressReleaseId, $body);

        return [
            'id' => $row['id'],
            'press_release_id' => $row['press_release_id'],
            'body' => $row['body'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    public static function getByPressReleaseId(int $pressReleaseId): array
    {
        if (!PressReleaseRepository::exists($pressReleaseId)) {
            throw ServiceException::notFound('Press release not found');
        }

        return CommentRepository::findByPressReleaseId($pressReleaseId);
    }

    private static function validate(string $body): void
    {
        if (mb_strlen($body) === 0) {
            throw ServiceException::validation('EMPTY_BODY', 'Comment body must not be empty');
        }

        if (mb_strlen($body) > self::BODY_MAX_LENGTH) {
            throw ServiceException::validation('TOO_LONG', 'Comment body must be at most ' . self::BODY_MAX_LENGTH . ' characters');
        }
    }
}
