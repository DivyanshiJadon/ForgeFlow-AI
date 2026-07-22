<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$provider = new \App\Services\AI\Providers\HermesProvider();
$response = $provider->generateResponse([
    ['role' => 'user', 'content' => 'hello']
], []);

echo "HERMES RESPONSE:\n";
echo $response . "\n";
