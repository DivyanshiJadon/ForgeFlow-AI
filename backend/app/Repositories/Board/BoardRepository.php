<?php

namespace App\Repositories\Board;

use App\Models\Board;
use Illuminate\Database\Eloquent\Collection;

class BoardRepository implements BoardRepositoryInterface
{
    public function all(): Collection
    {
        return Board::all();
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
            'lists.cards.comments'
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
