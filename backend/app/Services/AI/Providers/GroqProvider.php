<?php

namespace App\Services\AI\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqProvider implements AIProviderInterface
{
    /**
     * Generate response via Groq free-tier OpenAI-compatible API.
     */
    public function generateResponse(array $messages, array $context): string
    {
        $apiKey = env('GROQ_API_KEY');
        $apiBase = rtrim(env('GROQ_API_BASE', 'https://api.groq.com/openai/v1'), '/');
        $model = env('GROQ_MODEL', 'openai/gpt-oss-120b');

        if (empty($apiKey)) {
            return '⚠️ **Groq API Key Missing:** Add `GROQ_API_KEY` to your backend `.env` file. Get a free key at https://console.groq.com';
        }

        Log::info("Dispatching chat request to Groq API: {$apiBase}/chat/completions [Model: {$model}]");

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(90)
                ->post($apiBase . '/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'stream' => false,
                ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'] ?? 'No message content returned from Groq API.';
            }

            Log::error("Groq API returned status {$response->status()}: " . $response->body());
            $errorMsg = $response->json()['error']['message'] ?? $response->body();

            return "⚠️ **Groq API Error ({$response->status()}):** {$errorMsg}";

        } catch (\Exception $e) {
            Log::error('Groq API connection exception: ' . $e->getMessage());

            return "⚠️ **Groq Connection Error:** {$e->getMessage()}";
        }
    }
}
