<?php

namespace App\Services\AI\Providers;

interface AIProviderInterface
{
    /**
     * Send chat messages and context payload to the LLM backend.
     *
     * @param array $messages Conversations list array.
     * @param array $context Metadata context (current board state, lists, tasks).
     * @return string LLM reply content.
     */
    public function generateResponse(array $messages, array $context): string;
}
