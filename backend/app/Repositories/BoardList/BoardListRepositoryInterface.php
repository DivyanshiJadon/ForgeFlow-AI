<?php

namespace App\Repositories\BoardList;

use App\Models\BoardList;

interface BoardListRepositoryInterface
{
    public function find(int $id): ?BoardList;
    public function create(array $data): BoardList;
    public function update(BoardList $boardList, array $data): bool;
    public function delete(BoardList $boardList): bool;
}
