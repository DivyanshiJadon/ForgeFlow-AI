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
        set_time_limit((int) env('AI_MAX_EXECUTION_SECONDS', 180));

        try {
            $validated = $request->validated();
            
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

            return response()->json([
                'reply' => $reply,
                'message' => $reply
            ]);

        } catch (\Exception $e) {
            Log::error('AI chat endpoint failure: ' . $e->getMessage());
            return response()->json([
                'reply' => "⚠️ **AI Engine Error:** " . $e->getMessage()
            ], 500);
        }
    }
}
