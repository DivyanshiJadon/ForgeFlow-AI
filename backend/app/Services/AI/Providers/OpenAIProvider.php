<?php

namespace App\Services\AI\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIProvider implements AIProviderInterface
{
    /**
     * Generate response via OpenAI cloud endpoint.
     */
    public function generateResponse(array $messages, array $context): string
    {
        $apiKey = env('OPENAI_API_KEY');
        $model = env('OPENAI_MODEL', 'gpt-4o-mini');

        if (empty($apiKey)) {
            return "⚠️ **OpenAI Configuration Missing:** The `OPENAI_API_KEY` environment variable is not defined in your `.env` file.";
        }

        Log::info("Sending AI request to OpenAI for model '{$model}'.");

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'] ?? 'No response content returned.';
            }

            Log::error('OpenAI Provider failed. Status: ' . $response->status() . ' - Body: ' . $response->body());
            return "⚠️ **OpenAI API Failure:** The cloud server responded with HTTP status **{$response->status()}**.";

        } catch (\Exception $e) {
            Log::error('OpenAI Provider exception: ' . $e->getMessage());
            return "⚠️ **OpenAI Connection Error:** Could not contact the OpenAI servers.";
        }
    }
}
