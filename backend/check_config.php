<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Current Environment Configuration ===\n";
echo "GROQ_API_KEY: " . (env('GROQ_API_KEY') ? substr(env('GROQ_API_KEY'), 0, 10) . '...' : 'NOT SET') . "\n";
echo "GROQ_MODEL: " . (env('GROQ_MODEL') ?: 'default (using llama3-8b-8192)') . "\n";
echo "GEMINI_API_KEY: " . (env('GEMINI_API_KEY') ? substr(env('GEMINI_API_KEY'), 0, 10) . '...' : 'NOT SET') . "\n";
echo "AI_PROVIDER: " . (env('AI_PROVIDER') ?: 'default (groq)') . "\n";
echo "HERMES_API_BASE: " . (env('HERMES_API_BASE') ?: 'default (http://127.0.0.1:11434/v1)') . "\n";
echo "\n=== Testing AI Providers ===\n";

// Test Groq
if (env('GROQ_API_KEY')) {
    echo "\nTesting Groq provider...\n";
    $groq = new \App\Services\AI\Providers\GroqProvider();
    $reply = $groq->generateResponse([
        ['role' => 'user', 'content' => 'Say hello in one word.']
    ], []);
    echo "Groq response: " . substr($reply, 0, 200) . "\n";
} else {
    echo "\nSkipping Groq - no API key set.\n";
}

// Test Gemini
if (env('GEMINI_API_KEY')) {
    echo "\nTesting Gemini provider...\n";
    $gemini = new \App\Services\AI\Providers\GeminiProvider();
    $reply = $gemini->generateResponse([
        ['role' => 'user', 'content' => 'Say hello in one word.']
    ], []);
    echo "Gemini response: " . substr($reply, 0, 200) . "\n";
} else {
    echo "\nSkipping Gemini - no API key set.\n";
}

echo "\n=== Check AI Service chain ===\n";
$aiService = $app->make(\App\Services\AI\AIService::class);
// Use reflection to test resolveProviderChain
$ref = new ReflectionMethod($aiService, 'resolveProviderChain');
$ref->setAccessible(true);
$chain = $ref->invoke($aiService);
echo "Resolved provider chain: " . implode(', ', $chain) . "\n";

