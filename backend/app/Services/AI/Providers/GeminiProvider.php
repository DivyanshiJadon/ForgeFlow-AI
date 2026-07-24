<?php

namespace App\Services\AI\Providers;

class GeminiProvider extends OpenAICompatibleProvider
{
    public function name(): string
    {
        return 'gemini';
    }
}
