<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Slack\SlackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlackController extends Controller
{
    public function __construct(
        private SlackService $slack
    ) {}

    /**
     * POST /api/test-slack
     *
     * Send a test message to Slack to verify the integration is working.
     * Body: { "channel": "#general", "message": "Hello from ForgeFlow AI!" }
     */
    public function testSlack(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => 'sometimes|string|max:80',
            'message' => 'sometimes|string|max:2000',
        ]);

        if (!$this->slack->isConfigured()) {
            return response()->json([
                'ok' => false,
                'message' => 'Slack is not configured. Set SLACK_BOT_TOKEN in your .env file.',
            ], 422);
        }

        $channel = $validated['channel'] ?? null;
        $text = $validated['message'] ?? ':rocket: ForgeFlow AI is connected to Slack!';

        $result = $this->slack->sendMessage($channel, $text);

        if ($result['ok']) {
            $sentTo = $channel ?: '#general';
            return response()->json([
                'ok' => true,
                'message' => "Test message sent to {$sentTo}.",
                'ts' => $result['ts'] ?? null,
            ]);
        }

        return response()->json([
            'ok' => false,
            'message' => "Slack API error: {$result['error']}",
        ], 502);
    }
}
