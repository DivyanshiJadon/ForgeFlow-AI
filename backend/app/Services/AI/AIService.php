<?php

namespace App\Services\AI;

use App\Services\AI\Providers\AIProviderInterface;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\GroqProvider;
use App\Services\AI\Providers\HermesProvider;
use App\Services\AI\Providers\OpenAIProvider;
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
        OpenAIProvider $openAIProvider,
    ) {
        $this->promptBuilder = $promptBuilder;
        $this->providers = [
            'groq' => $groqProvider,
            'gemini' => $geminiProvider,
            'hermes' => $hermesProvider,
            'openai' => $openAIProvider,
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
            Log::info("Provider {$providerName} response:");

            if (!$this->isProviderFailureReply($reply)) {
                Log::info("Provider {$providerName} succeeded.");
                return $reply;
            }

            Log::warning("Provider {$providerName} failed, trying next fallback.");
        }

        // Last resort: try Hermes/Ollama even if not in the resolved chain (could be transient)
        if (!in_array('hermes', $this->resolveProviderChain(), true)) {
            Log::info('Attempting Hermes/Ollama as last-resort fallback...');
            $hermesReply = $this->providers['hermes']->generateResponse($fullMessages, $context);
            if (!$this->isProviderFailureReply($hermesReply)) {
                return $hermesReply;
            }
        }

        return '⚠️ All AI providers failed. Check your API keys and network connectivity. Ensure your `GROQ_API_KEY` and `GEMINI_API_KEY` in `.env` are valid, or start Ollama locally with `ollama run qwen2.5-coder:latest`.';
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
        ])));

        $resolved = array_values(array_filter($chain, function (string $name): bool {
            if ($name === 'groq') {
                return !empty(env('GROQ_API_KEY'));
            }

            if ($name === 'gemini') {
                return !empty(env('GEMINI_API_KEY'));
            }

            if ($name === 'hermes') {
                return $this->isOllamaReachable();
            }

            return false;
        }));

        // Always try at least one cloud provider if keys exist
        if (empty($resolved)) {
            if (!empty(env('GROQ_API_KEY'))) {
                return ['groq'];
            }
            if (!empty(env('GEMINI_API_KEY'))) {
                return ['gemini'];
            }
        }

        return $resolved;
    }

    protected function isOllamaReachable(): bool
    {
        $apiBase = rtrim(env('HERMES_API_BASE', 'http://127.0.0.1:11434/v1'), '/');
        $healthUrl = preg_replace('#/v1$#', '', $apiBase) . '/v1/models';

        try {
            Log::info('Checking Ollama...');
            Log::info('Health URL: ' . $healthUrl);

            $response = Http::connectTimeout(3)
                ->timeout(5)
                ->get($healthUrl);

            Log::info('Health Status: ' . $response->status());

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

