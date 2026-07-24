<?php

namespace App\Services\AI\Providers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Shared implementation for every provider that speaks the OpenAI-compatible
 * `/chat/completions` protocol (Groq, Gemini OpenAI endpoint, local Hermes /
 * Ollama). Subclasses only supply configuration and, where relevant, override
 * availability probing. All HTTP, retry, timeout, logging and error handling
 * live here so individual providers stay tiny.
 */
abstract class OpenAICompatibleProvider implements AIProviderInterface
{
    /**
     * @param  array<string, mixed>  $config  Provider config slice from config/ai.php.
     * @param  int  $retries  Extra attempts on transient failure.
     * @param  int  $retryDelayMs  Delay between attempts.
     */
    public function __construct(
        protected array $config,
        protected int $retries = 2,
        protected int $retryDelayMs = 400,
    ) {}

    abstract public function name(): string;

    /**
     * Cloud providers only need a credential; the request itself (with fast
     * connect timeout + retries) verifies reachability. Local providers
     * override this to probe the server.
     */
    public function isAvailable(): bool
    {
        return ! empty($this->apiKey());
    }

    public function generateResponse(array $messages, array $context): string
    {
        $url = $this->apiBase().'/chat/completions';
        $startedAt = microtime(true);

        try {
            $response = Http::withHeaders($this->headers())
                ->withOptions($this->httpOptions())
                ->connectTimeout($this->connectTimeout())
                ->timeout($this->timeout())
                ->retry($this->retries + 1, $this->retryDelayMs, function ($exception, $request) {
                    // Retry on connection issues; do not retry on 4xx client
                    // errors (bad key/model) — those never self-heal.
                    return $exception instanceof ConnectionException;
                }, throw: false)
                ->post($url, $this->payload($messages));

            $durationMs = $this->elapsedMs($startedAt);

            if ($response->successful()) {
                $content = data_get($response->json(), 'choices.0.message.content');

                if (! is_string($content) || trim($content) === '') {
                    Log::warning('[AI] Provider returned empty content', [
                        'provider' => $this->name(),
                        'status' => $response->status(),
                        'duration_ms' => $durationMs,
                    ]);

                    throw new ProviderException("{$this->name()} returned an empty response", $response->status());
                }

                Log::info('[AI] Provider request succeeded', [
                    'provider' => $this->name(),
                    'model' => $this->model(),
                    'status' => $response->status(),
                    'duration_ms' => $durationMs,
                ]);

                return $content;
            }

            $reason = data_get($response->json(), 'error.message') ?? 'HTTP '.$response->status();

            Log::warning('[AI] Provider request failed', [
                'provider' => $this->name(),
                'status' => $response->status(),
                'duration_ms' => $durationMs,
                'reason' => $reason,
            ]);

            throw new ProviderException("{$this->name()}: {$reason}", $response->status());
        } catch (ConnectionException $e) {
            Log::warning('[AI] Provider unreachable', [
                'provider' => $this->name(),
                'duration_ms' => $this->elapsedMs($startedAt),
                'reason' => $e->getMessage(),
            ]);

            throw new ProviderException("{$this->name()} is unreachable or timed out");
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @return array<string, mixed>
     */
    protected function payload(array $messages): array
    {
        return [
            'model' => $this->model(),
            'messages' => $messages,
            'temperature' => 0.7,
            'stream' => false,
        ];
    }

    /**
     * Extra Guzzle options (overridden by local providers, e.g. to skip TLS
     * verification against a localhost server).
     *
     * @return array<string, mixed>
     */
    protected function httpOptions(): array
    {
        return [];
    }

    /**
     * @return array<string, string>
     */
    protected function headers(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if (! empty($this->apiKey())) {
            $headers['Authorization'] = 'Bearer '.$this->apiKey();
        }

        return $headers;
    }

    protected function apiBase(): string
    {
        return rtrim((string) ($this->config['base'] ?? ''), '/');
    }

    protected function model(): string
    {
        return (string) ($this->config['model'] ?? '');
    }

    protected function apiKey(): ?string
    {
        $key = $this->config['key'] ?? null;

        return $key === null ? null : (string) $key;
    }

    protected function connectTimeout(): int
    {
        return (int) ($this->config['connect_timeout'] ?? 5);
    }

    protected function timeout(): int
    {
        return (int) ($this->config['timeout'] ?? 45);
    }

    protected function elapsedMs(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
