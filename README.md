# ForgeFlow AI (SprintForge) — AI-Powered Kanban SaaS

> **Forge 2 Qualifier Project**  
> An AI-powered project & sprint management tool built with Laravel, React, and local Hermes/OpenClaw LLM integration.

---

## 🌟 Application Features

1. **Workspace Management**: Create custom sprint workspaces with templates (*Blank*, *Software Sprint*, *Product Roadmap*, *Bug Tracker*, *Marketing Campaign*), custom accent colors, and icons.
2. **Kanban Columns & Lists**: Dynamic column creation, inline title renaming, and list reordering.
3. **Card Management**: Priority badges (**HIGH**, **MEDIUM**, **LOW**), due dates with overdue highlighting, assigned member avatars, tags, and comment threads.
4. **Hermes Cursor AI Copilot**: Side panel powered by local Hermes/OpenClaw stack (`http://localhost:11434/v1`). Supports board summaries, sprint planning, task breakdowns, user story generation, effort estimation, and backlog prioritization.
5. **Keyboard Shortcuts**:
   - `Cmd/Ctrl + K` or `Cmd/Ctrl + J`: Toggle Cursor Copilot.
   - `Cmd/Ctrl + N`: Create New Task.
   - `Escape`: Close active modals & drawers.

---

## 🤖 Models & AI Setup

- **Primary Provider**: Hermes / OpenClaw running locally via Ollama (`http://localhost:11434/v1`).
- **Model**: `qwen2.5-coder:latest` (or Groq / Gemini free tier models).
- **Reasoning**: `qwen2.5-coder` provides fast, local code generation and structured plan formatting without API costs or rate-limit lockouts.

---

## 🛠️ Local Run Instructions

### Prerequisites
- Node.js 22+ & npm
- PHP 8.2+ & Composer
- SQLite extension enabled in PHP

### Step 1: Backend Setup (Laravel)
```bash
cd backend
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```
*Laravel API server starts at `http://127.0.0.1:8000`*

### Step 2: Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Vite frontend starts at `http://localhost:5173`*

### Step 3: Local Ollama / Hermes Engine (Optional for AI Copilot)
```bash
ollama run qwen2.5-coder:latest
```
*Serves OpenAI-compatible endpoint at `http://localhost:11434/v1/chat/completions`*

---

## 📁 Repository Structure

```
├── backend/            # Laravel 11 API (SQLite, Clean Architecture)
├── frontend/           # React 19 + Vite + Tailwind CSS UI
├── skills/             # Hermes SKILL.md status-report definitions
├── openclaw.json       # OpenClaw agent configuration (sanitized)
├── hermes.json         # Hermes orchestrator configuration
├── ARCHITECTURE.md     # Multi-agent roles & Slack channel scheme
├── agent-log.md        # Unedited chat exchanges and agent task logs
└── README.md           # Setup and project documentation
```
