<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AIChatRequest;
use App\Services\AI\AIService;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Chat endpoint for ForgeFlow AI panel.
     * Saves conversation to a session automatically.
     */
    public function chat(AIChatRequest $request): JsonResponse
    {
        set_time_limit((int) env('AI_MAX_EXECUTION_SECONDS', 600));

        try {
            $validated = $request->validated();
            $user = $request->attributes->get('auth_user');

            // Format messages array
            $messages = $validated['messages'] ?? [];
            if (empty($messages) && !empty($validated['message'])) {
                $messages = [
                    ['role' => 'user', 'content' => $validated['message']]
                ];
            }

            // Format context array
            $context = $validated['context'] ?? [];
            if (empty($context) && isset($validated['board_id'])) {
                $context = ['board_id' => $validated['board_id']];
            }

            Log::info('Incoming AI request', [
                'messages' => $messages,
                'context' => $context,
            ]);

            $reply = $this->aiService->chat($messages, $context);

            // Auto-create or use existing session, and save messages
            $sessionId = $validated['session_id'] ?? null;
            $session = null;

            if ($sessionId) {
                $session = ChatSession::find($sessionId);
                if ($session && $user && $session->user_id !== $user->id) {
                    $session = null; // Not authorized
                }
            }

            // If no valid session, create one automatically
            if (!$session && !empty($validated['message'])) {
                $boardId = $validated['board_id'] ?? null;
                $session = ChatSession::create([
                    'board_id' => $boardId,
                    'user_id' => $user?->id,
                    'title' => $this->generateTitle($validated['message']),
                ]);
            }

            if ($session) {
                // Save user message
                if (!empty($validated['message'])) {
                    ChatMessage::create([
                        'session_id' => $session->id,
                        'role' => 'user',
                        'content' => $validated['message'],
                    ]);
                }
                // Save assistant response
                ChatMessage::create([
                    'session_id' => $session->id,
                    'role' => 'assistant',
                    'content' => $reply,
                ]);
                $session->touch();
            }

            return response()->json([
                'reply' => $reply,
                'message' => $reply,
                'session_id' => $session?->id,
            ]);

        } catch (\Exception $e) {
            Log::error('AI chat endpoint failure: ' . $e->getMessage());
            return response()->json([
                'reply' => "⚠️ **AI Engine Error:** " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return current AI provider configuration.
     */
    public function config(): JsonResponse
    {
        $provider = strtolower((string) env('AI_PROVIDER', 'groq'));

        $models = [
            'groq' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            'gemini' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
            'hermes' => env('HERMES_MODEL', 'qwen2.5-coder'),
            'openai' => env('OPENAI_MODEL', 'gpt-4.1'),
        ];

        $model = $models[$provider] ?? 'unknown';

        return response()->json([
            'provider' => $provider,
            'model' => $model,
            'status' => 'connected',
        ]);
    }

    /**
     * Generate a short title from the user's first message.
     */
    protected function generateTitle(string $message): string
    {
        $cleaned = trim(strip_tags($message));
        $cleaned = preg_replace('/\s+/', ' ', $cleaned);

        if (mb_strlen($cleaned) <= 60) {
            return $cleaned ?: 'New Chat';
        }

        return mb_substr($cleaned, 0, 57) . '...';
    }
}
