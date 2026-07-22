<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CommentResource;
use App\Repositories\Card\CardRepositoryInterface;
use App\Services\Card\CardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    protected $cardRepository;
    protected $cardService;

    public function __construct(
        CardRepositoryInterface $cardRepository,
        CardService $cardService
    ) {
        $this->cardRepository = $cardRepository;
        $this->cardService = $cardService;
    }

    /**
     * Add a comment to a task card.
     */
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
            $validated['author_name'] = 'Developer'; // Default standard author name
        }

        $comment = $this->cardService->addComment($card, $validated);

        return response()->json(new CommentResource($comment), 201);
    }
}
