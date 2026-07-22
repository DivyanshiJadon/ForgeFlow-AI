<?php

namespace App\Services\Board;

use App\Models\Board;
use App\Models\BoardList;
use App\Models\ActivityLog;
use App\Repositories\Board\BoardRepositoryInterface;

class BoardService
{
    protected $boardRepository;

    public function __construct(BoardRepositoryInterface $boardRepository)
    {
        $this->boardRepository = $boardRepository;
    }

    /**
     * Create a new workspace/board and populate columns based on template selection.
     */
    public function createBoard(array $data): Board
    {
        $boardName = $data['name'];

        $board = $this->boardRepository->create([
            'name' => $boardName,
            'title' => $boardName,
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#6366f1',
            'icon' => $data['icon'] ?? 'kanban',
        ]);

        $template = strtolower($data['template'] ?? 'blank');

        $columns = [];

        switch ($template) {
            case 'sprint':
            case 'software_sprint':
            case 'software sprint':
                $columns = ['Sprint Backlog', 'In Progress', 'In Review', 'Released'];
                break;
            case 'roadmap':
            case 'product_roadmap':
            case 'product roadmap':
                $columns = ['Q1 Goals', 'In Research', 'In Build', 'Live'];
                break;
            case 'bugs':
            case 'bug_tracker':
            case 'bug tracker':
                $columns = ['Triage', 'Investigating', 'In Fix', 'QA Passed'];
                break;
            case 'marketing':
            case 'marketing_campaign':
            case 'marketing campaign':
                $columns = ['Ideas', 'Drafting', 'Review', 'Published'];
                break;
            case 'blank':
            default:
                $columns = ['To Do', 'In Progress', 'Done'];
                break;
        }

        // Create default board lists (columns)
        foreach ($columns as $index => $colName) {
            BoardList::create([
                'board_id' => $board->id,
                'name' => $colName,
                'position' => $index + 1,
            ]);
        }

        // Log the board creation activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_name' => 'System',
            'action' => 'workspace_created',
            'details' => "Created workspace using " . ucfirst(str_replace('_', ' ', $template)) . " template with " . count($columns) . " columns.",
        ]);

        return $board->load('lists.cards');
    }
}
