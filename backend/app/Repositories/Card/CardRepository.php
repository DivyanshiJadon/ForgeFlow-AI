<?php

namespace App\Repositories\Card;

use App\Models\Card;

class CardRepository implements CardRepositoryInterface
{
    public function find(int $id): ?Card
    {
        return Card::find($id);
    }

    public function findWithRelations(int $id): ?Card
    {
        return Card::with(['member', 'tags', 'comments'])->find($id);
    }

    public function create(array $data): Card
    {
        return Card::create($data);
    }

    public function update(Card $card, array $data): bool
    {
        return $card->update($data);
    }

    public function delete(Card $card): bool
    {
        return $card->delete();
    }

    public function syncTags(Card $card, array $tagIds): void
    {
        $card->tags()->sync($tagIds);
    }

    public function addComment(Card $card, array $commentData)
    {
        return $card->comments()->create($commentData);
    }
}
