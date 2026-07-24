<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AICopilotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Deterministic defaults; individual tests tweak provider config.
        config([
            'ai.provider' => 'groq',
            'ai.retries' => 0,
            'ai.providers.groq.key' => null,
            'ai.providers.gemini.key' => null,
            'ai.providers.hermes.base' => 'http://127.0.0.1:11434/v1',
        ]);
    }

    public function test_it_uses_groq_first_when_available(): void
    {
        config(['ai.providers.groq.key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['content' => 'Groq answer']]],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', ['message' => 'hello']);

        $response->assertOk()->assertJson(['reply' => 'Groq answer']);
    }

    public function test_it_falls_back_to_gemini_when_groq_fails(): void
    {
        config([
            'ai.providers.groq.key' => 'test-key',
            'ai.providers.gemini.key' => 'gem-key',
        ]);

        Http::fake([
            'api.groq.com/*' => Http::response(['error' => ['message' => 'boom']], 500),
            'generativelanguage.googleapis.com/*' => Http::response([
                'choices' => [['message' => ['content' => 'Gemini answer']]],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', ['message' => 'hello']);

        $response->assertOk()->assertJson(['reply' => 'Gemini answer']);
    }

    public function test_it_falls_back_to_mock_when_no_live_provider_is_available(): void
    {
        // No keys, Ollama offline -> the mock safety net answers, never an error.
        Http::fake([
            '127.0.0.1:11434/*' => Http::response('', 500),
        ]);

        $response = $this->postJson('/api/ai/chat', ['message' => 'give me help']);

        $response->assertOk();
        $this->assertStringContainsString('ForgeFlow AI', $response->json('reply'));
    }

    public function test_hermes_is_skipped_when_ollama_is_offline(): void
    {
        config(['ai.provider' => 'hermes']);

        // /v1/models unreachable => hermes must not receive a chat request.
        Http::fake([
            '127.0.0.1:11434/v1/models' => Http::response('', 503),
            '127.0.0.1:11434/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'should not be used']]],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', ['message' => 'summarize']);

        $response->assertOk();
        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/chat/completions'));
    }

    public function test_hermes_runs_when_online_and_model_installed(): void
    {
        config([
            'ai.provider' => 'hermes',
            'ai.providers.hermes.model' => 'qwen2.5-coder:latest',
        ]);

        Http::fake([
            '127.0.0.1:11434/v1/models' => Http::response([
                'data' => [['id' => 'qwen2.5-coder:latest']],
            ], 200),
            '127.0.0.1:11434/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Hermes answer']]],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', ['message' => 'summarize']);

        $response->assertOk()->assertJson(['reply' => 'Hermes answer']);
    }
}
