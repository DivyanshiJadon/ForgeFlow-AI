<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateBoardRequest;
use App\Http\Requests\Api\UpdateBoardRequest;
use App\Http\Resources\Api\BoardResource;
use App\Repositories\Board\BoardRepositoryInterface;
use App\Services\Board\BoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class BoardController extends Controller
{
    protected $boardRepository;
    protected $boardService;

    public function __construct(
        BoardRepositoryInterface $boardRepository,
        BoardService $boardService
    ) {
        $this->boardRepository = $boardRepository;
        $this->boardService = $boardService;
    }

    /**
     * Get all boards.
     */
    public function index(): JsonResponse
    {
        try {
            $boards = $this->boardRepository->all();
            return response()->json(BoardResource::collection($boards));
        } catch (\Exception $e) {
            Log::error('Failed to list boards: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve workspaces: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new board (workspace) with template support.
     */
    public function store(CreateBoardRequest $request): JsonResponse
    {
        try {
            $board = $this->boardService->createBoard($request->validated());
            return response()->json(new BoardResource($board), 201);
        } catch (\Exception $e) {
            Log::error('Failed to create board: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create workspace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific board details with lists, cards, and attachments.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->findWithRelations($id);

            if (!$board) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            return response()->json(new BoardResource($board));
        } catch (\Exception $e) {
            Log::error("Failed to show board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load workspace details: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update board settings (name, description, color, icon).
     */
    public function update(UpdateBoardRequest $request, int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->find($id);

            if (!$board) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            $this->boardRepository->update($board, $request->validated());

            return response()->json(new BoardResource($board));
        } catch (\Exception $e) {
            Log::error("Failed to update board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to update workspace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a board.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->find($id);

            if (!$board) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            $this->boardRepository->delete($board);

            return response()->json(['message' => 'Workspace deleted successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to delete board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete workspace: ' . $e->getMessage()], 500);
        }
    }
}
