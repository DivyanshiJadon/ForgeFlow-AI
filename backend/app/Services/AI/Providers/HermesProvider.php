<?php

namespace App\Services\AI\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Local Hermes / OpenClaw / Ollama provider (OpenAI-compatible endpoint).
 *
 * Unlike the cloud providers, this is only attempted when the Ollama server is
 * actually running AND the configured model is installed — probed via a fast
 * `/v1/models` call. This prevents the copilot from ever hanging on (or falling
 * back through) a local server that is offline.
 */
class HermesProvider extends OpenAICompatibleProvider
{
    public function name(): string
    {
        return 'hermes';
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::withOptions($this->httpOptions())
                ->connectTimeout((int) ($this->config['health_connect_timeout'] ?? 2))
                ->timeout((int) ($this->config['health_timeout'] ?? 3))
                ->get($this->apiBase().'/models');

            if (! $response->successful()) {
                Log::info('[AI] Hermes skipped: /v1/models returned HTTP '.$response->status());

                return false;
            }

            $models = collect(data_get($response->json(), 'data', []))
                ->pluck('id')
                ->filter()
                ->all();

            if (! $this->modelInstalled($models)) {
                Log::info('[AI] Hermes skipped: model not installed', [
                    'model' => $this->model(),
                    'available' => $models,
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::info('[AI] Hermes skipped: Ollama offline ('.$e->getMessage().')');

            return false;
        }
    }

    /**
     * Accept an exact match or a tag-insensitive match (e.g. config wants
     * "qwen2.5-coder:latest" and the server reports "qwen2.5-coder").
     *
     * @param  array<int, string>  $models
     */
    protected function modelInstalled(array $models): bool
    {
        $wanted = $this->model();
        $wantedBase = explode(':', $wanted)[0];

        foreach ($models as $model) {
            if ($model === $wanted) {
                return true;
            }
            if (explode(':', $model)[0] === $wantedBase) {
                return true;
            }
        }

        return false;
    }

    protected function httpOptions(): array
    {
        return [
            'verify' => false,
            'version' => 1.1,
        ];
    }
}
