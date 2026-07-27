<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CommentResource;
use App\Repositories\Card\CardRepositoryInterface;
use App\Services\Card\CardService;
use App\Services\Activity\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    protected $cardRepository;
    protected $cardService;
    protected $activityService;

    public function __construct(
        CardRepositoryInterface $cardRepository,
        CardService $cardService,
        ActivityService $activityService
    ) {
        $this->cardRepository = $cardRepository;
        $this->cardService = $cardService;
        $this->activityService = $activityService;
    }

    public function store(Request $request, int $cardId): JsonResponse
    {
        $card = $this->cardRepository->find($cardId);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string',
            'author_name' => 'nullable|string|max:100',
        ]);

        if (empty($validated['author_name'])) {
            $validated['author_name'] = 'Developer';
        }

        $comment = $this->cardService->addComment($card, $validated);

        // Find the board_id via board_list
        $boardList = \App\Models\BoardList::findOrFail($card->board_list_id);
        $this->activityService->log(
            $boardList->board_id,
            'comment_added',
            "Commented on card '{$card->title}': \"" . substr($comment->content, 0, 50) . "...\"",
            null
        );

        return response()->json(new CommentResource($comment), 201);
    }
}
