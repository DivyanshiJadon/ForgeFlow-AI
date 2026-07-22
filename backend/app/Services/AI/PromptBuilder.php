<?php

namespace App\Services\AI;

use App\Models\Board;
use App\Models\BoardList;

class PromptBuilder
{
    /**
     * Build the context-rich system prompt, injecting the active board schema.
     */
    public function buildSystemPrompt(array $context): string
    {
        $boardId = $context['board_id'] ?? null;
        $boardInfo = "No active workspace selected.";

        if ($boardId) {
            $board = Board::find($boardId);
            if ($board) {
                $boardInfo = "Active Workspace: '{$board->name}' (ID: {$board->id})\n";
                $boardInfo .= "Description: " . ($board->description ?? 'No description') . "\n\n";

                $lists = BoardList::with('cards.member', 'cards.tags')->where('board_id', $boardId)->get();
                $boardInfo .= "--- CURRENT KANBAN STRUCTURE ---\n";
                if ($lists->isEmpty()) {
                    $boardInfo .= "The board currently contains no lists or cards.\n";
                } else {
                    foreach ($lists as $list) {
                        $boardInfo .= "Column: '{$list->name}' (ID: {$list->id})\n";
                        foreach ($list->cards as $card) {
                            $assignee = $card->member ? $card->member->name : 'Unassigned';
                            $tags = $card->tags->pluck('name')->implode(', ');
                            $boardInfo .= "  - Card: '{$card->title}' (ID: {$card->id})\n";
                            $boardInfo .= "    Priority: {$card->priority}\n";
                            $boardInfo .= "    Assignee: {$assignee}\n";
                            $boardInfo .= "    Tags: [" . ($tags ?: 'None') . "]\n";
                            $boardInfo .= "    Description: " . ($card->description ?: 'No description') . "\n";
                        }
                    }
                }
            }
        }

        return "You are ForgeFlow AI, the premium AI Project & Sprint Management assistant running inside the SprintForge board workspace.

You help developers, managers, and designers build project plans, prioritize backlogs, write agile user stories, break down feature requirements into sub-tasks, and audit workflows.

Keep your answers highly professional, concise, action-oriented, and formatted in clean markdown. 
Never refer to yourself as a demo or mock tool. 
Always use the user's active workspace data provided below to ground your analysis.

Here is the current workspace database state:
{$boardInfo}

When asked to plan a sprint, organize tasks into logical phases. When asked to estimate effort, use the Fibonacci sequence (1, 2, 3, 5, 8). Offer clear actionable recommendations.";
    }
}
