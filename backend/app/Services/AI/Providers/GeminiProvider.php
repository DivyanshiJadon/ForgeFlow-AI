<?php

namespace App\Services\AI\Providers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements AIProviderInterface
{
    /**
     * Generate response via Google Gemini free-tier OpenAI-compatible API.
     */
    public function generateResponse(array $messages, array $context): string
    {
        $apiKey = env('GEMINI_API_KEY');
        $apiBase = rtrim(env('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai'), '/');
        $model = env('GEMINI_MODEL', 'gemini-2.5-flash');

        if (empty($apiKey)) {
            return '⚠️ **Gemini API Key Missing:** Add `GEMINI_API_KEY` to your backend `.env` file. Get a free key at https://aistudio.google.com';
        }

        Log::info("Dispatching chat request to Gemini API: {$apiBase}/chat/completions [Model: {$model}]");

        try {
            $response = Http::withoutVerifying()
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->connectTimeout(10)
                ->timeout((int) env('GEMINI_TIMEOUT_SECONDS', 30))
                ->post($apiBase . '/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'stream' => false,
                ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'] ?? 'No message content returned from Gemini API.';
            }

            Log::error("Gemini API returned status {$response->status()}: " . $response->body());
            $errorMsg = $response->json()['error']['message'] ?? $response->body();

            return "⚠️ **Gemini API Error ({$response->status()}):** {$errorMsg}";

        } catch (ConnectionException $e) {
            Log::error('Gemini API connection timeout: ' . $e->getMessage());
            return '⚠️ **Gemini Connection Timeout:** Could not connect to Gemini API. Check your network connection.';

        } catch (\Exception $e) {
            Log::error('Gemini API connection exception: ' . $e->getMessage());

            return "⚠️ **Gemini Connection Error:** {$e->getMessage()}";
        }
    }
}

