# Slack Export & Integration Evidence

This directory contains evidence of Slack round-trip test outputs, event subscriptions, and multi-agent channel communications.

## Channel Structure
- `#sprint-main`: Hermes Orchestrator updates & human commands
- `#agent-coder`: OpenClaw task execution reports
- `#agent-log`: Cron event logs and audit streams

## Round-Trip Test Verification Output
```json
{
  "auth_test": {
    "ok": true,
    "url": "https://forgeflow-ai.slack.com/",
    "team": "ForgeFlow AI Workspace",
    "user": "hermes_bot",
    "team_id": "T08XXXXX",
    "user_id": "U08XXXXX"
  },
  "chat_postMessage": {
    "ok": true,
    "channel": "C08XXXXX",
    "ts": "1721640000.000100",
    "message": {
      "text": "round-trip test ✅"
    }
  }
}
```
