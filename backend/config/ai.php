<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Preferred AI Provider
    |--------------------------------------------------------------------------
    |
    | The provider the copilot attempts first. When it is unavailable or fails,
    | the service falls back through the remaining providers in priority order
    | (groq -> gemini -> hermes -> mock).
    |
    | IMPORTANT: every value here is read through config() (not env()) so the
    | copilot keeps working when the config is cached with `php artisan
    | config:cache`. Reading env() directly at runtime returns null once the
    | config cache exists, which is the root cause of "keys are ignored".
    |
    */

    'provider' => env('AI_PROVIDER', 'groq'),

    /*
    | Hard ceiling (seconds) for the PHP request handling an AI chat call.
    | LLM inference can exceed PHP's default 30s limit.
    */
    'max_execution_seconds' => (int) env('AI_MAX_EXECUTION_SECONDS', 180),

    /*
    | How many additional attempts to make on a transient network/5xx failure
    | before giving up on a provider (0 = single attempt). Requirement: retry
    | failed requests twice.
    */
    'retries' => (int) env('AI_RETRY_ATTEMPTS', 2),

    /*
    | Delay (milliseconds) between retry attempts.
    */
    'retry_delay_ms' => (int) env('AI_RETRY_DELAY_MS', 400),

    'providers' => [

        'groq' => [
            'key' => env('GROQ_API_KEY'),
            'base' => env('GROQ_API_BASE', 'https://api.groq.com/openai/v1'),
            'model' => env('GROQ_MODEL', 'openai/gpt-oss-120b'),
            'connect_timeout' => (int) env('GROQ_CONNECT_TIMEOUT', 5),
            'timeout' => (int) env('GROQ_TIMEOUT_SECONDS', 45),
        ],

        'gemini' => [
            'key' => env('GEMINI_API_KEY'),
            'base' => env('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai'),
            'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
            'connect_timeout' => (int) env('GEMINI_CONNECT_TIMEOUT', 5),
            'timeout' => (int) env('GEMINI_TIMEOUT_SECONDS', 45),
        ],

        'hermes' => [
            'key' => env('HERMES_API_KEY', 'sk-none'),
            'base' => env('HERMES_API_BASE', 'http://127.0.0.1:11434/v1'),
            'model' => env('HERMES_MODEL', 'qwen2.5-coder:latest'),
            // Fast probe used to confirm Ollama is actually running before we
            // ever send a (slow) chat request to it.
            'health_connect_timeout' => (int) env('HERMES_HEALTH_CONNECT_TIMEOUT', 2),
            'health_timeout' => (int) env('HERMES_HEALTH_TIMEOUT', 3),
            'connect_timeout' => (int) env('HERMES_CONNECT_TIMEOUT', 5),
            'timeout' => (int) env('HERMES_TIMEOUT_SECONDS', 90),
        ],

    ],

];
