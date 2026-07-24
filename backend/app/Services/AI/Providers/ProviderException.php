<?php

namespace App\Services\AI\Providers;

use RuntimeException;

/**
 * Raised when an AI provider cannot fulfil a request. Carries a short, safe
 * reason (used for logging and fallback decisions) and an optional HTTP status.
 * The raw message is never surfaced to end users.
 */
class ProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $status = null,
    ) {
        parent::__construct($message);
    }
}
