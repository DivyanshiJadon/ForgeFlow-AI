<?php
/**
 * Auto-fix script for backend/.env configuration
 * Run: php fix_env.php
 */

$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) {
    die("ERROR: .env file not found at $envFile\n");
}

$content = file_get_contents($envFile);
$changes = [];

// Fix 1: GROQ_MODEL - change from invalid "openai/gpt-oss-120b" to working "llama-3.3-70b-versatile"
if (preg_match('/^GROQ_MODEL=openai\/gpt-oss-120b/m', $content)) {
    $content = preg_replace(
        '/^GROQ_MODEL=openai\/gpt-oss-120b/m',
        'GROQ_MODEL=llama-3.3-70b-versatile',
        $content
    );
    $changes[] = "FIXED: GROQ_MODEL changed from 'openai/gpt-oss-120b' to 'llama-3.3-70b-versatile'";
} else {
    $changes[] = "OK: GROQ_MODEL already set to a valid value (or not using the invalid one)";
}

// Fix 2: AI_PROVIDER - change from "hermes" to "groq" (since Ollama isn't running)
if (preg_match('/^AI_PROVIDER=hermes/m', $content)) {
    $content = preg_replace(
        '/^AI_PROVIDER=hermes/m',
        'AI_PROVIDER=groq',
        $content
    );
    $changes[] = "FIXED: AI_PROVIDER changed from 'hermes' to 'groq'";
} else {
    $changes[] = "OK: AI_PROVIDER already set to groq or another valid value";
}

// Fix 3: Add GROQ_TIMEOUT_SECONDS if not present (increase timeout for slower connections)
if (!preg_match('/^GROQ_TIMEOUT_SECONDS=/m', $content)) {
    $content .= "\nGROQ_TIMEOUT_SECONDS=120\n";
    $changes[] = "ADDED: GROQ_TIMEOUT_SECONDS=120 (increased timeout)";
}

// Fix 4: Add GEMINI_TIMEOUT_SECONDS if not present
if (!preg_match('/^GEMINI_TIMEOUT_SECONDS=/m', $content)) {
    $content .= "\nGEMINI_TIMEOUT_SECONDS=120\n";
    $changes[] = "ADDED: GEMINI_TIMEOUT_SECONDS=120 (increased timeout)";
}

// Write back
file_put_contents($envFile, $content);

echo "=== Changes Applied ===\n";
foreach ($changes as $change) {
    echo "  $change\n";
}

echo "\n=== What you still need to do ===\n";
echo "1. For Gemini SSL error, install CA certificates:\n";
echo "   Download https://curl.se/ca/cacert.pem\n";
echo "   Save to: " . __DIR__ . "/cacert.pem\n";
echo "   Then add to .env: GEMINI_VERIFY_SSL=false (temporary workaround)\n";
echo "\n2. Restart the Laravel backend after this fix:\n";
echo "   cd backend && php artisan serve\n";
echo "\nDone! All config fixes applied.\n";

