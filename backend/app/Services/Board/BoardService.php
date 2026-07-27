<?php

namespace App\Services\Board;

use App\Models\Board;
use App\Models\BoardList;
use App\Models\Member;
use App\Models\User;
use App\Repositories\Board\BoardRepositoryInterface;
use App\Services\Activity\ActivityService;

class BoardService
{
    protected $boardRepository;
    protected $activityService;

    public function __construct(
        BoardRepositoryInterface $boardRepository,
        ActivityService $activityService
    ) {
        $this->boardRepository = $boardRepository;
        $this->activityService = $activityService;
    }

    public function createBoard(array $data, ?User $user = null): Board
    {
        $boardName = $data['name'];

        $board = $this->boardRepository->create([
            'user_id' => $user?->id,
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

        foreach ($columns as $index => $colName) {
            BoardList::create([
                'board_id' => $board->id,
                'name' => $colName,
                'position' => $index + 1,
            ]);
        }

        // Auto-add the creator as board member with Owner role
        if ($user) {
            $member = Member::firstOrCreate(
                ['email' => $user->email],
                [
                    'name' => $user->name,
                    'avatar_color' => '#6366f1',
                ]
            );
            $board->members()->attach($member->id, ['role' => 'owner']);
        }

        $this->activityService->log(
            $board->id,
            'workspace_created',
            "Created workspace using " . ucfirst(str_replace('_', ' ', $template)) . " template with " . count($columns) . " columns.",
            $user
        );

        return $board->load('lists.cards');
    }
}
