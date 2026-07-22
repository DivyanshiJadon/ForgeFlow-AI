<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateCardRequest;
use App\Http\Requests\Api\UpdateCardRequest;
use App\Http\Requests\Api\ReorderCardRequest;
use App\Http\Resources\Api\CardResource;
use App\Repositories\Card\CardRepositoryInterface;
use App\Services\Card\CardService;
use Illuminate\Http\JsonResponse;

class CardController extends Controller
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
     * Create a new task card.
     */
    public function store(CreateCardRequest $request): JsonResponse
    {
        $card = $this->cardService->createCard($request->validated());
        return response()->json(new CardResource($card), 201);
    }

    /**
     * Get a specific task card.
     */
    public function show(int $id): JsonResponse
    {
        $card = $this->cardRepository->findWithRelations($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        return response()->json(new CardResource($card));
    }

    /**
     * Update details on a card (assignee, priority, due date, description).
     */
    public function update(UpdateCardRequest $request, int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $updatedCard = $this->cardService->updateCard($card, $request->validated());

        return response()->json(new CardResource($updatedCard));
    }

    /**
     * Drag and drop / reorder cards positions and columns.
     */
    public function reorder(ReorderCardRequest $request, int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $validated = $request->validated();
        
        $updatedCard = $this->cardService->reorderCard(
            $card,
            $validated['board_list_id'],
            $validated['position']
        );

        return response()->json(new CardResource($updatedCard));
    }

    /**
     * Delete a task card.
     */
    public function destroy(int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $this->cardService->deleteCard($card);

        return response()->json(['message' => 'Task deleted successfully.']);
    }
}
