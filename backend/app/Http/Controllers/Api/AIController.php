<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AIChatRequest;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
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
     */
    public function chat(AIChatRequest $request): JsonResponse
    {
        // LLM inference can exceed PHP's default 30s limit (especially local Ollama on CPU).
        set_time_limit((int) config('ai.max_execution_seconds', 180));

        try {
            $validated = $request->validated();

            // Format messages array
            $messages = $validated['messages'] ?? [];
            if (empty($messages) && ! empty($validated['message'])) {
                $messages = [
                    ['role' => 'user', 'content' => $validated['message']],
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

            return response()->json([
                'reply' => $reply,
                'message' => $reply,
            ]);

        } catch (\Throwable $e) {
            // Log the real error server-side, but never leak stack traces or
            // technical detail to the client.
            Log::error('[AI] Chat endpoint failure', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'reply' => "I'm having trouble contacting the AI provider right now. Please try again in a few seconds.",
                'message' => "I'm having trouble contacting the AI provider right now. Please try again in a few seconds.",
            ], 200);
        }
    }
}
