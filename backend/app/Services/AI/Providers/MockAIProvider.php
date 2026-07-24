<?php

namespace App\Services\AI\Providers;

use App\Models\Board;
use App\Models\BoardList;
use App\Models\Card;

class MockAIProvider implements AIProviderInterface
{
    public function name(): string
    {
        return 'mock';
    }

    /**
     * The offline safety net is always available and never throws — it grounds
     * its answers in live board data so the copilot can still respond usefully
     * when no live LLM can be reached.
     */
    public function isAvailable(): bool
    {
        return true;
    }

    public function generateResponse(array $messages, array $context): string
    {
        $boardId = $context['board_id'] ?? null;
        $userPrompt = strtolower(end($messages)['content'] ?? '');

        // Fetch board details if available
        $board = null;
        $lists = [];
        $totalCards = 0;
        
        if ($boardId) {
            $board = Board::find($boardId);
            if ($board) {
                $lists = BoardList::with('cards.member', 'cards.tags')->where('board_id', $boardId)->get();
                foreach ($lists as $l) {
                    $totalCards += $l->cards->count();
                }
            }
        }

        // 1. SUMMARIZE BOARD
        if (str_contains($userPrompt, 'summarize') || str_contains($userPrompt, 'summary')) {
            if (!$board) {
                return "### Workspace Summary\n\nNo workspace is active right now. Please select or create a workspace first so I can summarize it.";
            }

            $output = "### 📊 Workspace Summary: **{$board->name}**\n";
            $output .= "Here is an audit of your workspace status. We tracked **" . count($lists) . "** lists containing **{$totalCards}** task cards.\n\n";

            if (count($lists) === 0) {
                $output .= "> ⚠️ **This board is empty.** Start by adding lists and tasks, or click the templates option to generate cards.\n";
                return $output;
            }

            foreach ($lists as $list) {
                $output .= "- **{$list->name}** (" . $list->cards->count() . " tasks)\n";
                foreach ($list->cards as $card) {
                    $prioBadge = $this->getPrioEmoji($card->priority);
                    $assignee = $card->member ? "@{$card->member->name}" : "unassigned";
                    $output .= "  - `{$prioBadge}` **{$card->title}** — {$assignee}\n";
                }
            }

            // Bottleneck logic
            $output .= "\n#### 💡 Actionable Insights:\n";
            $inProgressList = $lists->first(fn($l) => str_contains(strtolower($l->name), 'progress'));
            if ($inProgressList && $inProgressList->cards->count() > 3) {
                $output .= "- **WIP Alert:** You have {$inProgressList->cards->count()} tasks in 'In Progress'. Consider limiting WIP to prevent bottlenecks.\n";
            }
            $highPrioCount = Card::whereIn('board_list_id', $lists->pluck('id'))->where('priority', 'high')->count();
            if ($highPrioCount > 0) {
                $output .= "- **High Priority Focus:** There are **{$highPrioCount}** critical high-priority items. I recommend resolving these before picking up new work.\n";
            } else {
                $output .= "- **Healthy Velocity:** No critical priority blocks found. The backlog is ready for new items.\n";
            }

            return $output;
        }

        // 2. CREATE SPRINT / PLAN SPRINT
        if (str_contains($userPrompt, 'sprint') || str_contains($userPrompt, 'plan my project')) {
            if (!$board) {
                return "### 📅 Sprint Planner\n\nNo active board found. Please create a board first to plan a sprint.";
            }

            $output = "### 📅 AI-Generated Sprint Plan for **{$board->name}**\n";
            $output .= "I have structured a **2-week sprint timeline** based on the tasks currently on your board.\n\n";

            // Grab all cards
            $allCards = [];
            foreach ($lists as $list) {
                foreach ($list->cards as $card) {
                    $allCards[] = $card;
                }
            }

            if (count($allCards) === 0) {
                $output .= "Your backlog is currently empty. Here is a suggested template to kick off a software sprint:\n\n";
                $output .= "#### **Sprint 1 (Weeks 1-2): Core Architecture & Database Setup**\n";
                $output .= "- `[ ]` Setup SQLite Database & Relational Schema *(High)*\n";
                $output .= "- `[ ]` Define Repository Interfaces & Service Layers *(High)*\n";
                $output .= "- `[ ]` Build Auth & Middleware Validation *(Medium)*\n\n";
                $output .= "#### **Sprint 2 (Weeks 3-4): Frontend Integration & Redesign**\n";
                $output .= "- `[ ]` Configure Tailwind CSS v4 Layout & Theme Context *(High)*\n";
                $output .= "- `[ ]` Build Drag-and-Drop Board Grid *(Medium)*\n";
                $output .= "- `[ ]` Collapsible AI panel chat components *(Medium)*\n\n";
                $output .= "💡 *Would you like me to automatically create these lists and cards on your current board? If so, reply with **'Apply Software Sprint'**.*";
                return $output;
            }

            $sprint1 = [];
            $sprint2 = [];
            foreach ($allCards as $index => $card) {
                if ($card->priority === 'high' || $index % 2 === 0) {
                    $sprint1[] = $card;
                } else {
                    $sprint2[] = $card;
                }
            }

            $output .= "#### 🟢 Sprint 1 (Current - Target: 2 Weeks)\n";
            $output .= "*Focus: High-priority items and core database infrastructure.*\n";
            foreach ($sprint1 as $card) {
                $output .= "- `{$this->getPrioEmoji($card->priority)}` **{$card->title}** (Est: 3-5 Story Points)\n";
            }

            $output .= "\n#### 🔵 Sprint 2 (Next - Target: 2 Weeks)\n";
            $output .= "*Focus: Secondary features, polish, and front-end design enhancements.*\n";
            foreach ($sprint2 as $card) {
                $output .= "- `{$this->getPrioEmoji($card->priority)}` **{$card->title}** (Est: 1-3 Story Points)\n";
            }

            return $output;
        }

        // 3. BREAK FEATURE INTO TASKS
        if (str_contains($userPrompt, 'break') || str_contains($userPrompt, 'tasks')) {
            $output = "### 🛠️ Feature Task Breakdown\n";
            $output .= "Let's break down your main feature requirements into sub-tasks suitable for your Kanban board.\n\n";
            $output .= "#### **Suggested Sub-tasks Checklist:**\n";
            $output .= "1. **Database Schema & Scaffolding**\n";
            $output .= "   - `[ ]` Create migration files, define cascade deletes and indexes.\n";
            $output .= "   - `[ ]` Formulate Eloquent models, relations, and fillable fields.\n";
            $output .= "2. **Repository & Controller Setup**\n";
            $output .= "   - `[ ]` Write Service class to isolate business logic.\n";
            $output .= "   - `[ ]` Register Controllers under `app/Http/Controllers/Api/` and implement Form Requests.\n";
            $output .= "3. **Frontend Integration**\n";
            $output .= "   - `[ ]` Construct Context API provider to handle server requests.\n";
            $output .= "   - `[ ]` Redesign CSS framework using glassmorphism layouts.\n";
            $output .= "   - `[ ]` Embed keyboard shortcuts and drag-and-drop feedback.\n\n";
            $output .= "💡 *You can select these sub-tasks to copy-paste them directly into your card description!*";
            return $output;
        }

        // 4. PRIORITIZE BACKLOG
        if (str_contains($userPrompt, 'prioritize') || str_contains($userPrompt, 'backlog')) {
            if (!$board) {
                return "### ⚖️ Backlog Prioritization\n\nNo active board found. Please select a board to prioritize.";
            }

            $allCards = [];
            foreach ($lists as $list) {
                foreach ($list->cards as $card) {
                    $allCards[] = $card;
                }
            }

            if (count($allCards) === 0) {
                return "### ⚖️ Backlog Prioritization\n\nYour backlog is currently empty. Add some tasks first, and I will sort them by priority level, due date, and assignee workload.";
            }

            $output = "### ⚖️ Prioritized Workload Analysis for **{$board->name}**\n";
            $output .= "I have sorted your workspace backlog into tier rankings based on business impact and urgency:\n\n";

            $high = array_filter($allCards, fn($c) => $c->priority === 'high');
            $medium = array_filter($allCards, fn($c) => $c->priority === 'medium');
            $low = array_filter($allCards, fn($c) => $c->priority === 'low');

            $output .= "#### 🔥 Tier 1 (Critical Priority)\n";
            $output .= "*Must address immediately to unblock team velocity.*\n";
            if (count($high) === 0) $output .= "- *None currently marked high priority.*\n";
            foreach ($high as $card) {
                $output .= "- **{$card->title}** — Currently in *{$card->boardList->name}*\n";
            }

            $output .= "\n#### ⚡ Tier 2 (Standard Priority)\n";
            $output .= "*Core feature set. Pull into sprint once Tier 1 is resolved.*\n";
            if (count($medium) === 0) $output .= "- *None currently marked medium priority.*\n";
            foreach ($medium as $card) {
                $output .= "- **{$card->title}** — Currently in *{$card->boardList->name}*\n";
            }

            $output .= "\n#### 💤 Tier 3 (Nice-To-Have)\n";
            $output .= "*Refactoring, styling polish, and non-blocking logs.*\n";
            if (count($low) === 0) $output .= "- *None currently marked low priority.*\n";
            foreach ($low as $card) {
                $output .= "- **{$card->title}** — Currently in *{$card->boardList->name}*\n";
            }

            return $output;
        }

        // 5. GENERATE USER STORIES
        if (str_contains($userPrompt, 'user stories') || str_contains($userPrompt, 'story')) {
            $output = "### 📖 AI User Story Generator\n";
            $output .= "Here are standard agile user stories compiled for your project features:\n\n";
            $output .= "1. **As a** Project Manager,  \n";
            $output .= "   **I want** a collapsible AI panel at my fingertips,  \n";
            $output .= "   **So that** I can summarize my boards and plan sprints with natural language commands.\n\n";
            $output .= "2. **As a** Software Developer,  \n";
            $output .= "   **I want** drag-and-drop boards with optimistic state updating,  \n";
            $output .= "   **So that** my column transitions are fluid and lag-free.\n\n";
            $output .= "3. **As a** Stakeholder,  \n";
            $output .= "   **I want** automated activity audit logging,  \n";
            $output .= "   **So that** I can track progress history on boards without asking for manual updates.\n";
            return $output;
        }

        // 6. ESTIMATE EFFORT
        if (str_contains($userPrompt, 'estimate') || str_contains($userPrompt, 'effort')) {
            if (!$board) {
                return "### ⏱️ Story Points Estimation\n\nPlease select a board to estimate effort for its tasks.";
            }

            $output = "### ⏱️ Story Point Recommendations for **{$board->name}**\n";
            $output .= "Using the Fibonacci sequence (1, 2, 3, 5, 8), here are proposed effort estimates for your active board tasks:\n\n";

            $hasCards = false;
            foreach ($lists as $list) {
                foreach ($list->cards as $card) {
                    $hasCards = true;
                    // Propose points based on name length / priority
                    $pts = 3;
                    if ($card->priority === 'high') $pts = 5;
                    if ($card->priority === 'low') $pts = 1;
                    if (str_contains(strtolower($card->title), 'setup') || str_contains(strtolower($card->title), 'database')) $pts = 8;
                    
                    $output .= "- **{$card->title}** (Priority: " . ucfirst($card->priority) . ") → **{$pts} SP**\n";
                }
            }

            if (!$hasCards) {
                $output .= "- *Your board is empty. Add tasks to see point estimations.*";
            }

            return $output;
        }

        // 7. SUGGEST NEXT TASK
        if (str_contains($userPrompt, 'next task') || str_contains($userPrompt, 'suggest next')) {
            if (!$board || count($lists) === 0) {
                return "### 🎯 Suggested Next Task\n\nNo active workspace tasks to analyze. Create tasks in your board first!";
            }

            // Find first task in 'To Do' (or similar column) with highest priority
            $todoList = $lists->first(fn($l) => str_contains(strtolower($l->name), 'todo') || str_contains(strtolower($l->name), 'to do') || str_contains(strtolower($l->name), 'backlog'));
            if (!$todoList) {
                $todoList = $lists->first();
            }

            if ($todoList && $todoList->cards->count() > 0) {
                // Sort by priority (high first)
                $sortedCards = $todoList->cards->sortBy(function($card) {
                    if ($card->priority === 'high') return 0;
                    if ($card->priority === 'medium') return 1;
                    return 2;
                });
                
                $next = $sortedCards->first();
                return "### 🎯 AI Suggestion: Next Task to Pull\n\nI recommend pulling this task next based on board state:\n\n" .
                       "- **Task Name:** `{$next->title}`\n" .
                       "- **Current Column:** `{$todoList->name}`\n" .
                       "- **Priority:** `{$this->getPrioEmoji($next->priority)}` " . ucfirst($next->priority) . "\n" .
                       "- **Reasoning:** It resides in your entry backlog and has the highest business priority, and is currently unassigned. Resolving this will clear the path for subsequent sprint items.";
            }

            return "### 🎯 Suggested Next Task\n\nAll tasks in your backlog are either in progress or finished. Great job! Consider creating new tasks using the **'Break feature into tasks'** prompt.";
        }

        // DEFAULT HELP
        return "### 🤖 ForgeFlow AI Assistant\n\nWelcome to **ForgeFlow AI**! I am connected to your workspace data and ready to assist you. Here are commands you can run:\n\n" .
               "- **Summarize workspace**: Inspect current task counts and bottlenecks.\n" .
               "- **Plan my project / Create sprint**: Group your tasks into structured two-week sprints.\n" .
               "- **Break feature into tasks**: Breakdown a requirement description into cards.\n" .
               "- **Prioritize backlog**: Organize your tasks by critical tier levels.\n" .
               "- **Estimate effort**: Propose story points for tasks using the Fibonacci sequence.\n" .
               "- **Suggest next task**: Tell you which task in the backlog to tackle next.\n\n" .
               "*I am also integration-ready with Hermes/OpenClaw. Switch my driver in your `.env` file to enable live language model inference.*";
    }

    private function getPrioEmoji(string $priority): string
    {
        switch (strtolower($priority)) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    }
}
