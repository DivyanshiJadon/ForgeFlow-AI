<?php

namespace App\Repositories\BoardList;

use App\Models\BoardList;

class BoardListRepository implements BoardListRepositoryInterface
{
    public function find(int $id): ?BoardList
    {
        return BoardList::find($id);
    }

    public function create(array $data): BoardList
    {
        return BoardList::create($data);
    }

    public function update(BoardList $boardList, array $data): bool
    {
        return $boardList->update($data);
    }

    public function delete(BoardList $boardList): bool
    {
        return $boardList->delete();
    }
}
