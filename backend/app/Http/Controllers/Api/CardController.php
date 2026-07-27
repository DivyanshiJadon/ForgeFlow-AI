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
use Illuminate\Http\Request;

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

    public function store(CreateCardRequest $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $card = $this->cardService->createCard($request->validated(), $user);
        return response()->json(new CardResource($card), 201);
    }

    public function show(int $id): JsonResponse
    {
        $card = $this->cardRepository->findWithRelations($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        return response()->json(new CardResource($card));
    }

    public function update(UpdateCardRequest $request, int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $user = $request->attributes->get('auth_user');
        $updatedCard = $this->cardService->updateCard($card, $request->validated(), $user);

        return response()->json(new CardResource($updatedCard));
    }

    public function reorder(ReorderCardRequest $request, int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $user = $request->attributes->get('auth_user');
        $validated = $request->validated();
        
        $updatedCard = $this->cardService->reorderCard(
            $card,
            $validated['board_list_id'],
            $validated['position'],
            $user
        );

        return response()->json(new CardResource($updatedCard));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $card = $this->cardRepository->find($id);

        if (!$card) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $user = $request->attributes->get('auth_user');
        $this->cardService->deleteCard($card, $user);

        return response()->json(['message' => 'Task deleted successfully.']);
    }
}
