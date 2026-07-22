<?php

namespace App\Repositories\Board;

use App\Models\Board;
use Illuminate\Database\Eloquent\Collection;

interface BoardRepositoryInterface
{
    public function all(): Collection;
    public function find(int $id): ?Board;
    public function findWithRelations(int $id): ?Board;
    public function create(array $data): Board;
    public function update(Board $board, array $data): bool;
    public function delete(Board $board): bool;
}
