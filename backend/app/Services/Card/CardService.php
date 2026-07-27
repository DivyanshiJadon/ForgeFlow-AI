<?php

namespace App\Services\Card;

use App\Models\Card;
use App\Models\BoardList;
use App\Repositories\Card\CardRepositoryInterface;
use App\Services\Activity\ActivityService;
use App\Models\User;

class CardService
{
    protected $cardRepository;
    protected $activityService;

    public function __construct(
        CardRepositoryInterface $cardRepository,
        ActivityService $activityService
    ) {
        $this->cardRepository = $cardRepository;
        $this->activityService = $activityService;
    }

    public function createCard(array $data, ?User $user = null): Card
    {
        $boardList = BoardList::findOrFail($data['board_list_id']);
        
        if (!isset($data['position'])) {
            $maxPosition = Card::where('board_list_id', $data['board_list_id'])->max('position');
            $data['position'] = ($maxPosition ?? 0) + 1;
        }

        $card = $this->cardRepository->create($data);

        if (isset($data['tags'])) {
            $this->cardRepository->syncTags($card, $data['tags']);
        }

        $this->activityService->log(
            $boardList->board_id,
            'task_created',
            "Added card '{$card->title}' to list '{$boardList->name}'.",
            $user
        );

        return $card->load(['member', 'tags', 'comments']);
    }

    public function updateCard(Card $card, array $data, ?User $user = null): Card
    {
        $oldListId = $card->board_list_id;
        $oldTitle = $card->title;
        $oldPriority = $card->priority;

        $this->cardRepository->update($card, $data);

        if (isset($data['tags'])) {
            $this->cardRepository->syncTags($card, $data['tags']);
        }

        $boardList = BoardList::findOrFail($card->board_list_id);

        if (isset($data['board_list_id']) && $data['board_list_id'] != $oldListId) {
            $oldList = BoardList::find($oldListId);
            $oldListName = $oldList ? $oldList->name : 'Unknown';
            
            $this->activityService->log(
                $boardList->board_id,
                'task_moved',
                "Moved card '{$card->title}' from '{$oldListName}' to '{$boardList->name}'.",
                $user
            );
        }

        if (isset($data['priority']) && $data['priority'] != $oldPriority) {
            $this->activityService->log(
                $boardList->board_id,
                'task_priority_changed',
                "Changed priority of card '{$card->title}' to " . ucfirst($data['priority']) . ".",
                $user
            );
        }

        return $card->load(['member', 'tags', 'comments']);
    }

    public function reorderCard(Card $card, int $newListId, int $newPosition, ?User $user = null): Card
    {
        $oldListId = $card->board_list_id;
        $oldPosition = $card->position;

        if ($oldListId == $newListId) {
            if ($oldPosition < $newPosition) {
                Card::where('board_list_id', $oldListId)
                    ->whereBetween('position', [$oldPosition + 1, $newPosition])
                    ->decrement('position');
            } elseif ($oldPosition > $newPosition) {
                Card::where('board_list_id', $oldListId)
                    ->whereBetween('position', [$newPosition, $oldPosition - 1])
                    ->increment('position');
            }
        } else {
            Card::where('board_list_id', $oldListId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            Card::where('board_list_id', $newListId)
                ->where('position', '>=', $newPosition)
                ->increment('position');
        }

        $card->board_list_id = $newListId;
        $card->position = $newPosition;
        $card->save();

        $boardList = BoardList::findOrFail($newListId);
        
        if ($oldListId != $newListId) {
            $oldList = BoardList::find($oldListId);
            $oldListName = $oldList ? $oldList->name : 'Unknown';
            $this->activityService->log(
                $boardList->board_id,
                'task_dragged',
                "Dragged card '{$card->title}' from '{$oldListName}' to '{$boardList->name}'.",
                $user
            );
        }

        return $card->load(['member', 'tags', 'comments']);
    }

    public function addComment(Card $card, array $commentData)
    {
        $comment = $this->cardRepository->addComment($card, $commentData);
        return $comment;
    }

    public function deleteCard(Card $card, ?User $user = null): bool
    {
        $boardList = BoardList::findOrFail($card->board_list_id);
        $title = $card->title;
        $pos = $card->position;

        $deleted = $this->cardRepository->delete($card);

        if ($deleted) {
            Card::where('board_list_id', $boardList->id)
                ->where('position', '>', $pos)
                ->decrement('position');

            $this->activityService->log(
                $boardList->board_id,
                'task_deleted',
                "Deleted card '{$title}' from '{$boardList->name}'.",
                $user
            );
        }

        return $deleted;
    }
}
