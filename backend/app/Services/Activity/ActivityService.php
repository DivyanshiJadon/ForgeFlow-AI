<?php

namespace App\Services\Activity;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityService
{
    /**
     * Log an activity for a board.
     */
    public function log(
        int $boardId,
        string $action,
        string $details,
        ?User $user = null
    ): ActivityLog {
        return ActivityLog::create([
            'board_id' => $boardId,
            'user_name' => $user?->name ?? 'System',
            'action' => $action,
            'details' => $details,
        ]);
    }
}
