<?php

namespace App\Services\AI\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HermesProvider implements AIProviderInterface
{
    /**
     * Generate response via local Hermes / OpenClaw / Ollama server.
     */
    public function generateResponse(array $messages, array $context): string
    {
        $apiBase = rtrim(env('HERMES_API_BASE', 'http://127.0.0.1:11434/v1'), '/');
        $model = env('HERMES_MODEL', 'qwen2.5-coder:latest');
        $apiKey = env('HERMES_API_KEY', 'sk-none');

        Log::info("Dispatching chat request to Hermes API: {$apiBase}/chat/completions [Model: {$model}]");

        try {
            Log::info('===== OLLAMA PAYLOAD =====');
            Log::info(json_encode([
                'model' => $model,
                'messages' => $messages,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

           $response = Http::withOptions([
                'verify' => false,
                'version' => 1.1,
                'expect' => false,
            ])
            ->acceptJson()
            ->contentType('application/json')
            ->connectTimeout(10)
            ->timeout((int) env('HERMES_TIMEOUT_SECONDS', 120))
            ->post($apiBase . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
                'stream' => false,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                return $json['choices'][0]['message']['content'] ?? 'No message content returned from Hermes API.';
            }

            Log::error("Hermes API returned non-200 status code {$response->status()}: " . $response->body());
            return "⚠️ **Hermes API Error ({$response->status()}):** " . ($response->json()['error']['message'] ?? $response->body());

        } catch (\Exception $e) {
            Log::error('Hermes API connection exception: ' . $e->getMessage());
            return "⚠️ **Unable to reach local Hermes API at `{$apiBase}`.**\n\n" .
                   "**Troubleshooting Checklist:**\n" .
                   "1. Ensure Ollama server is running in the background. In a terminal, run: `ollama run qwen2.5-coder:latest`.\n" .
                   "2. Ensure port `11434` is listening.\n\n" .
                   "*Error details: " . $e->getMessage() . "*";
        }
    }
}
