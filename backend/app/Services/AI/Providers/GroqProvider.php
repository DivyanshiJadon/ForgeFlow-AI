<?php

namespace App\Services\AI\Providers;

use Illuminate\Http\Client\ConnectionException;
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
        $model = env('GROQ_MODEL', 'llama3-8b-8192');

        if (empty($apiKey)) {
            return '⚠️ **Groq API Key Missing:** Add `GROQ_API_KEY` to your backend `.env` file. Get a free key at https://console.groq.com';
        }

        Log::info("Dispatching chat request to Groq API: {$apiBase}/chat/completions [Model: {$model}]");

        try {
            $response = Http::withoutVerifying()
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->connectTimeout(10)
                ->timeout((int) env('GROQ_TIMEOUT_SECONDS', 30))
                ->post($apiBase . '/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'stream' => false,
                ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? null;
                if ($content === null) {
                    return '⚠️ **Groq API Warning:** No message content returned from Groq API.';
                }
                return $content;
            }

            Log::error("Groq API returned status {$response->status()}: " . $response->body());
            $errorMsg = $response->json()['error']['message'] ?? $response->body();

            return "⚠️ **Groq API Error ({$response->status()}):** {$errorMsg}";

        } catch (ConnectionException $e) {
            Log::error('Groq API connection timeout: ' . $e->getMessage());
            return '⚠️ **Groq Connection Timeout:** Could not connect to Groq API after 15 seconds. Check your network connection and API endpoint.';

        } catch (\Exception $e) {
            Log::error('Groq API connection exception: ' . $e->getMessage());

            return "⚠️ **Groq Connection Error:** {$e->getMessage()}";
        }
    }
}
