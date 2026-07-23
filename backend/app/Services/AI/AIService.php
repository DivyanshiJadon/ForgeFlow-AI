<?php

namespace App\Services\AI;

use App\Services\AI\Providers\AIProviderInterface;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\GroqProvider;
use App\Services\AI\Providers\HermesProvider;
use App\Services\AI\Providers\MockAIProvider;
use Illuminate\Support\Facades\Http;
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
            'ollama' => $hermesProvider,
            'mock' => $mockAIProvider,
        ];
    }

    /**
     * Coordinate chat message generation with automatic provider fallback.
     *
     * @param array $messages History list of the conversation.
     * @param array $context Active board meta details.
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

            Log::info("Processing AI chat via provider: {$providerName}");
            $reply = $provider->generateResponse($fullMessages, $context);

            if (!$this->isProviderFailureReply($reply)) {
                return $reply;
            }

            Log::warning("Provider {$providerName} failed, trying next fallback.");
        }

        return '⚠️ **All AI providers failed.** Add `GROQ_API_KEY` or `GEMINI_API_KEY` to backend `.env`, or start Ollama with `ollama run qwen2.5-coder:latest`.';
    }

    /**
     * Build ordered provider chain from env config + available credentials.
     *
     * @return list<string>
     */
    protected function resolveProviderChain(): array
    {
        $preferred = strtolower((string) env('AI_PROVIDER', 'groq'));
        $chain = array_values(array_unique(array_filter([
            $preferred,
            'groq',
            'gemini',
            'hermes',
            'mock',
        ])));

        return array_values(array_filter($chain, function (string $name): bool {
            if ($name === 'groq') {
                return !empty(env('GROQ_API_KEY'));
            }
            if ($name === 'gemini') {
                return !empty(env('GEMINI_API_KEY'));
            }
            if (in_array($name, ['hermes', 'ollama'], true)) {
                return $this->isOllamaReachable();
            }
            if ($name === 'mock') {
                return true;
            }

            return isset($this->providers[$name]);
        }));
    }

    protected function isOllamaReachable(): bool
    {
        $apiBase = rtrim(env('HERMES_API_BASE', 'http://127.0.0.1:11434/v1'), '/');
        $healthUrl = preg_replace('#/v1$#', '', $apiBase) . '/v1/models';

        try {
            $response = Http::connectTimeout(3)->timeout(5)->get($healthUrl);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('Ollama health check failed: ' . $e->getMessage());

            return false;
        }
    }

    protected function isProviderFailureReply(string $reply): bool
    {
        return str_starts_with($reply, '⚠️');
    }
}
