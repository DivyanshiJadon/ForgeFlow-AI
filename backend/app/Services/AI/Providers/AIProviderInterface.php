<?php

namespace App\Services\AI\Providers;

interface AIProviderInterface
{
    /**
     * Short machine name of the provider (e.g. "groq").
     */
    public function name(): string;

    /**
     * Whether the provider is usable right now: credentials present and, for
     * local providers, the server reachable and the model available. Cheap and
     * fast — this must never trigger a full inference call.
     */
    public function isAvailable(): bool;

    /**
     * Send chat messages and context payload to the LLM backend.
     *
     * @param  array  $messages  Conversation list array.
     * @param  array  $context  Metadata context (current board state, lists, tasks).
     * @return string LLM reply content.
     *
     * @throws ProviderException When the provider fails to produce a reply.
     */
    public function generateResponse(array $messages, array $context): string;
}
