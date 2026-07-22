<?php

namespace App\Services\Card;

use App\Models\Card;
use App\Models\BoardList;
use App\Models\ActivityLog;
use App\Repositories\Card\CardRepositoryInterface;

class CardService
{
    protected $cardRepository;

    public function __construct(CardRepositoryInterface $cardRepository)
    {
        $this->cardRepository = $cardRepository;
    }

    /**
     * Create a new card and log the activity.
     */
    public function createCard(array $data): Card
    {
        // Get the list to find the active board
        $boardList = BoardList::findOrFail($data['board_list_id']);
        
        // Auto-position at the end of the column
        if (!isset($data['position'])) {
            $maxPosition = Card::where('board_list_id', $data['board_list_id'])->max('position');
            $data['position'] = ($maxPosition ?? 0) + 1;
        }

        $card = $this->cardRepository->create($data);

        if (isset($data['tags'])) {
            $this->cardRepository->syncTags($card, $data['tags']);
        }

        // Log the activity
        ActivityLog::create([
            'board_id' => $boardList->board_id,
            'user_name' => 'System',
            'action' => 'task_created',
            'details' => "Added card '{$card->title}' to list '{$boardList->name}'.",
        ]);

        return $card->load(['member', 'tags', 'comments']);
    }

    /**
     * Update card fields, handle column changes, positioning, tags, and log activities.
     */
    public function updateCard(Card $card, array $data): Card
    {
        $oldListId = $card->board_list_id;
        $oldTitle = $card->title;
        $oldPriority = $card->priority;
        $oldMemberId = $card->member_id;

        // Perform the update
        $this->cardRepository->update($card, $data);

        if (isset($data['tags'])) {
            $this->cardRepository->syncTags($card, $data['tags']);
        }

        $boardList = BoardList::findOrFail($card->board_list_id);

        // Activity log conditionals
        if (isset($data['board_list_id']) && $data['board_list_id'] != $oldListId) {
            $oldList = BoardList::find($oldListId);
            $oldListName = $oldList ? $oldList->name : 'Unknown';
            
            ActivityLog::create([
                'board_id' => $boardList->board_id,
                'user_name' => 'System',
                'action' => 'task_moved',
                'details' => "Moved card '{$card->title}' from '{$oldListName}' to '{$boardList->name}'.",
            ]);
        }

        if (isset($data['priority']) && $data['priority'] != $oldPriority) {
            ActivityLog::create([
                'board_id' => $boardList->board_id,
                'user_name' => 'System',
                'action' => 'task_priority_changed',
                'details' => "Changed priority of card '{$card->title}' to " . ucfirst($data['priority']) . ".",
            ]);
        }

        return $card->load(['member', 'tags', 'comments']);
    }

    /**
     * Reorder card positions inside a list or across lists during drag and drop.
     */
    public function reorderCard(Card $card, int $newListId, int $newPosition): Card
    {
        $oldListId = $card->board_list_id;
        $oldPosition = $card->position;

        if ($oldListId == $newListId) {
            // Reordering in the same column
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
            // Moving between columns
            // Decrement items below in the old column
            Card::where('board_list_id', $oldListId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            // Increment items equal or below in the new column
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
            ActivityLog::create([
                'board_id' => $boardList->board_id,
                'user_name' => 'System',
                'action' => 'task_dragged',
                'details' => "Dragged card '{$card->title}' from '{$oldListName}' to '{$boardList->name}'.",
            ]);
        }

        return $card->load(['member', 'tags', 'comments']);
    }

    /**
     * Add a comment to a card.
     */
    public function addComment(Card $card, array $commentData)
    {
        $comment = $this->cardRepository->addComment($card, $commentData);
        
        // Log the comment
        $boardList = BoardList::findOrFail($card->board_list_id);
        ActivityLog::create([
            'board_id' => $boardList->board_id,
            'user_name' => $commentData['author_name'] ?? 'System',
            'action' => 'comment_added',
            'details' => "Commented on card '{$card->title}': \"" . substr($comment->content, 0, 50) . "...\"",
        ]);

        return $comment;
    }

    /**
     * Delete a card.
     */
    public function deleteCard(Card $card): bool
    {
        $boardList = BoardList::findOrFail($card->board_list_id);
        $title = $card->title;
        $pos = $card->position;

        $deleted = $this->cardRepository->delete($card);

        if ($deleted) {
            // Decrement remaining cards position
            Card::where('board_list_id', $boardList->id)
                ->where('position', '>', $pos)
                ->decrement('position');

            ActivityLog::create([
                'board_id' => $boardList->board_id,
                'user_name' => 'System',
                'action' => 'task_deleted',
                'details' => "Deleted card '{$title}' from '{$boardList->name}'.",
            ]);
        }

        return $deleted;
    }
}
