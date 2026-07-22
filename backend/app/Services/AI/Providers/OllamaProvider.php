<?php

namespace App\Services\AI\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaProvider implements AIProviderInterface
{
    /**
     * Generate response via local Ollama server directly.
     */
    public function generateResponse(array $messages, array $context): string
    {
        $apiBase = env('OLLAMA_API_BASE', 'http://localhost:11434');
        $model = env('OLLAMA_MODEL', 'llama3');

        Log::info("Sending AI request to Ollama at {$apiBase} for model '{$model}'.");

        try {
            $response = Http::timeout(60)->post($apiBase . '/api/chat', [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
                'options' => [
                    'temperature' => 0.7
                ]
            ]);

            if ($response->successful()) {
                return $response->json()['message']['content'] ?? 'No response content returned.';
            }

            Log::error('Ollama Provider failed. Status: ' . $response->status() . ' - Body: ' . $response->body());
            return "⚠️ **Ollama API Failure:** The server responded with HTTP status **{$response->status()}**.";

        } catch (\Exception $e) {
            Log::error('Ollama Provider exception: ' . $e->getMessage());
            return "⚠️ **Ollama Connection Error:** Unable to reach the Ollama server at `{$apiBase}`.";
        }
    }
}
