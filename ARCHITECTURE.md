# ARCHITECTURE.md — Multi-Agent Architecture & System Design

## 1. System Overview

**ForgeFlow AI** (SprintForge) is built around a two-agent human-in-the-loop paradigm:
- **Orchestrator (The Brain)**: Powered by **Hermes Agent**. Responsible for high-level goal decomposition, persistent cross-session memory, cron updates, and skill execution.
- **Coder / Hands (The Execution Agent)**: Powered by **OpenClaw**. Executes code changes, database migrations, scaffold builds, and reports task progress back to chat.

```
+-------------------------------------------------------------------+
|                        HUMAN PRODUCT OWNER                        |
+-------------------------------------------------------------------+
                                  |
                                  v
                        [ #sprint-main ] (Slack)
                                  |
                                  v
                +-----------------------------------+
                |   HERMES AGENT (The Brain)        |
                |   - Memory & Skill Execution      |
                |   - Goal Planning & Task Slicing  |
                +-----------------------------------+
                                  |
                                  v
                        [ #agent-coder ] (Slack)
                                  |
                                  v
                +-----------------------------------+
                |   OPENCLAW AGENT (The Hands)      |
                |   - Laravel Backend Scaffolding   |
                |   - React Frontend Styling        |
                +-----------------------------------+
                                  |
                                  v
                        [ #agent-log ] (Slack Audit Trail)
```

---

## 2. Agent Roles & Responsibilities

| Component | Agent | Primary Role | Channel |
| :--- | :--- | :--- | :--- |
| **Orchestrator (Brain)** | Hermes Agent | High-level sprint planning, memory retrieval, task assignment, status reports | `#sprint-main` |
| **Coder (Hands)** | OpenClaw Agent | Scaffolding models, running migrations, Vite/React UI updates, execution | `#agent-coder` |
| **Audit Stream** | Automated Cron | Autonomous status reports, build logs, and event streams | `#agent-log` |

---

## 3. Slack Channel Scheme

- **`#sprint-main`**: Primary channel for human $\leftrightarrow$ Hermes communication. All sprint goals, task decompositions, and decision prompts land here.
- **`#agent-coder`**: Sub-channel where Hermes delegates coding tasks to OpenClaw. OpenClaw posts execution output, file diffs, and verification steps here.
- **`#agent-log`**: Automated audit trail logging periodic cron runs, build statuses, and raw execution logs.

---

## 4. Model Routing Strategy

- **Brain Model (Hermes)**: Local `qwen2.5-coder:latest` served via Ollama (`http://localhost:11434/v1`) or Groq/Gemini free tiers. Chosen for reasoning quality, structured JSON outputs, and fast local inference.
- **Execution Model (OpenClaw)**: Local `qwen2.5-coder:latest` on Ollama. Selected for high code completion accuracy, zero API cost, and privacy.

---

## 5. Technology Stack & Frameworks

- **Backend**: Laravel 11 (PHP 8.2+), REST API, SQLite database (`database/database.sqlite`), Repository & Service Clean Architecture.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Glassmorphism design system.
- **AI Integration**: OpenAI-compatible local HTTP endpoint (`POST http://localhost:11434/v1/chat/completions`).
