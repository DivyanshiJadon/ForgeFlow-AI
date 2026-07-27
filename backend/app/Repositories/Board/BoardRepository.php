<?php

namespace App\Repositories\Board;

use App\Models\Board;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class BoardRepository implements BoardRepositoryInterface
{
    public function all(): Collection
    {
        return Board::all();
    }

    public function forUser(User $user): Collection
    {
        return Board::where('user_id', $user->id)->orderBy('updated_at', 'desc')->get();
    }

    public function find(int $id): ?Board
    {
        return Board::find($id);
    }

    public function findWithRelations(int $id): ?Board
    {
        return Board::with([
            'lists.cards.member',
            'lists.cards.tags',
            'lists.cards.comments',
            'activityLogs',
            'members'
        ])->find($id);
    }

    public function create(array $data): Board
    {
        // Reconcile 'name' and 'title' (in database it is title, but name is fillable and preferred)
        if (isset($data['name']) && !isset($data['title'])) {
            $data['title'] = $data['name'];
        }
        return Board::create($data);
    }

    public function update(Board $board, array $data): bool
    {
        if (isset($data['name']) && !isset($data['title'])) {
            $data['title'] = $data['name'];
        }
        return $board->update($data);
    }

    public function delete(Board $board): bool
    {
        return $board->delete();
    }
}
