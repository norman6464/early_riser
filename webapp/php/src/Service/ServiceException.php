<?php

namespace App\Service;

/**
 * サービス層で発生するビジネスエラーを表す例外
 *
 * コントローラーがHTTPステータスコードに変換する
 */
class ServiceException extends \RuntimeException
{
    private string $errorCode;
    private int $statusCode;

    public function __construct(string $errorCode, string $message, int $statusCode)
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->statusCode = $statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * リソースが見つからない場合の例外を生成する
     */
    public static function notFound(string $message): self
    {
        return new self('NOT_FOUND', $message, 404);
    }

    /**
     * バリデーションエラーの例外を生成する
     */
    public static function validation(string $code, string $message): self
    {
        return new self($code, $message, 400);
    }

    /**
     * 外部サービスエラーの例外を生成する
     */
    public static function external(string $code, string $message, int $statusCode = 502): self
    {
        return new self($code, $message, $statusCode);
    }
}
