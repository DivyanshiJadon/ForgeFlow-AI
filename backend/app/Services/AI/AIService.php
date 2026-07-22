<?php

namespace App\Services\AI;

use App\Services\AI\Providers\HermesProvider;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected $promptBuilder;
    protected $hermesProvider;

    public function __construct(PromptBuilder $promptBuilder, HermesProvider $hermesProvider)
    {
        $this->promptBuilder = $promptBuilder;
        $this->hermesProvider = $hermesProvider;
    }

    /**
     * Coordinate chat message generation exclusively via Hermes/OpenClaw/Ollama.
     *
     * @param array $messages History list of the conversation.
     * @param array $context Active board meta details.
     * @return string Reply markdown content.
     */
    public function chat(array $messages, array $context): string
    {
        Log::info("Processing AI Chat Request via local Hermes LLM Gateway.");

        $systemPrompt = $this->promptBuilder->buildSystemPrompt($context);
        $fullMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        );

        return $this->hermesProvider->generateResponse($fullMessages, $context);
    }
}
