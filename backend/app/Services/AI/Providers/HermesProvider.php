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
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->connectTimeout(15)
            ->timeout(300)
            ->post($apiBase . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
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
