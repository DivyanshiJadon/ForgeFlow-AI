<?php

namespace App\Services\Slack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackService
{
    private string $token;
    private string $defaultChannel;
    private string $apiBase = 'https://slack.com/api';

    public function __construct()
    {
        $this->token = (string) config('services.slack.token', env('SLACK_BOT_TOKEN', ''));
        $this->defaultChannel = (string) config('services.slack.channel', env('SLACK_DEFAULT_CHANNEL', '#general'));
    }

    /**
     * Send a message to a Slack channel.
     *
     * @param  string|null  $channel  Channel name or ID (defaults to SLACK_DEFAULT_CHANNEL).
     * @param  string       $text     Message text (supports Slack mrkdwn).
     * @return array{ok: bool, ts?: string, error?: string}
     */
    public function sendMessage(?string $channel, string $text): array
    {
        $channel = $channel ?: $this->defaultChannel;

        if (empty($this->token)) {
            Log::warning('Slack send attempted without SLACK_BOT_TOKEN configured.');
            return ['ok' => false, 'error' => 'SLACK_BOT_TOKEN not configured.'];
        }

        Log::info("Slack: sending message to {$channel}", [
            'text_length' => mb_strlen($text),
        ]);

        try {
            $response = Http::withToken($this->token)
                ->timeout(10)
                ->post("{$this->apiBase}/chat.postMessage", [
                    'channel' => $channel,
                    'text' => $text,
                    'unfurl_links' => false,
                ]);

            $body = $response->json();

            if ($response->successful() && ($body['ok'] ?? false)) {
                Log::info("Slack: message sent to {$channel}", [
                    'ts' => $body['ts'] ?? null,
                ]);
                return ['ok' => true, 'ts' => $body['ts'] ?? null];
            }

            $error = $body['error'] ?? 'unknown_error';
            Log::error("Slack API error: {$error}", [
                'channel' => $channel,
                'response' => $body,
            ]);
            return ['ok' => false, 'error' => $error];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Slack connection failed: ' . $e->getMessage());
            return ['ok' => false, 'error' => 'connection_failed'];

        } catch (\Throwable $e) {
            Log::error('Slack unexpected error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return ['ok' => false, 'error' => 'unexpected_error'];
        }
    }

    /**
     * Quick helper: send to the default channel.
     */
    public function notify(string $text): array
    {
        return $this->sendMessage(null, $text);
    }

    /**
     * Check if the Slack bot token is configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->token);
    }
}
