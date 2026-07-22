<?php

namespace App\Repositories\Card;

use App\Models\Card;
use Illuminate\Database\Eloquent\Collection;

interface CardRepositoryInterface
{
    public function find(int $id): ?Card;
    public function findWithRelations(int $id): ?Card;
    public function create(array $data): Card;
    public function update(Card $card, array $data): bool;
    public function delete(Card $card): bool;
    public function syncTags(Card $card, array $tagIds): void;
    public function addComment(Card $card, array $commentData);
}
