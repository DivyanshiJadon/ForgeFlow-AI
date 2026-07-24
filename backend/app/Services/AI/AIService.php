<?php

namespace App\Services\AI;

use App\Services\AI\Providers\AIProviderInterface;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\GroqProvider;
use App\Services\AI\Providers\HermesProvider;
use App\Services\AI\Providers\MockAIProvider;
use App\Services\AI\Providers\ProviderException;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected PromptBuilder $promptBuilder;

    /** @var array<string, AIProviderInterface> */
    protected array $providers;

    public function __construct(
        PromptBuilder $promptBuilder,
        GroqProvider $groqProvider,
        GeminiProvider $geminiProvider,
        HermesProvider $hermesProvider,
        MockAIProvider $mockAIProvider,
    ) {
        $this->promptBuilder = $promptBuilder;
        $this->providers = [
            'groq' => $groqProvider,
            'gemini' => $geminiProvider,
            'hermes' => $hermesProvider,
            // Alias so AI_PROVIDER=ollama resolves to the local server too.
            'ollama' => $hermesProvider,
            'mock' => $mockAIProvider,
        ];
    }

    /**
     * Coordinate chat message generation with automatic provider fallback.
     *
     * Each provider is checked for availability (fast, no inference) before it
     * is attempted, so an offline local server or a provider missing its key is
     * skipped instantly rather than causing a hang or a wasted request.
     *
     * @param  array  $messages  History list of the conversation.
     * @param  array  $context  Active board meta details.
     * @return string Reply markdown content.
     */
    public function chat(array $messages, array $context): string
    {
        $systemPrompt = $this->promptBuilder->buildSystemPrompt($context);
        $fullMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        );

        foreach ($this->resolveProviderChain() as $providerName) {
            $provider = $this->providers[$providerName] ?? null;
            if ($provider === null) {
                continue;
            }

            if (! $provider->isAvailable()) {
                Log::info("[AI] Skipping provider '{$providerName}': not available.");

                continue;
            }

            Log::info("[AI] Attempting provider '{$providerName}'.");

            try {
                return $provider->generateResponse($fullMessages, $context);
            } catch (ProviderException $e) {
                Log::warning("[AI] Provider '{$providerName}' failed, falling back.", [
                    'reason' => $e->getMessage(),
                    'status' => $e->status,
                ]);

                continue;
            }
        }

        // Reached only if even the always-on mock provider was excluded.
        Log::error('[AI] No provider could handle the request.');

        return $this->friendlyUnavailableMessage();
    }

    /**
     * Build the ordered provider chain from config: the preferred provider
     * first, then the remaining live providers by priority, and finally the
     * offline mock as a guaranteed responder.
     *
     * @return list<string>
     */
    protected function resolveProviderChain(): array
    {
        $preferred = strtolower((string) config('ai.provider', 'groq'));

        $chain = array_values(array_unique(array_filter([
            $preferred,
            'groq',
            'gemini',
            'hermes',
            'mock',
        ])));

        return array_values(array_filter(
            $chain,
            fn (string $name): bool => isset($this->providers[$name])
        ));
    }

    /**
     * User-facing message used only when nothing at all could respond. Kept
     * clean and free of stack traces / technical error detail.
     */
    protected function friendlyUnavailableMessage(): string
    {
        return "I'm having trouble contacting the AI provider right now. Please try again in a few seconds.";
    }
}
