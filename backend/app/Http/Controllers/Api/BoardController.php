<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateBoardRequest;
use App\Http\Requests\Api\UpdateBoardRequest;
use App\Http\Resources\Api\BoardResource;
use App\Http\Resources\Api\ActivityLogResource;
use App\Repositories\Board\BoardRepositoryInterface;
use App\Services\Board\BoardService;
use App\Services\Activity\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BoardController extends Controller
{
    protected $boardRepository;
    protected $boardService;
    protected $activityService;

    public function __construct(
        BoardRepositoryInterface $boardRepository,
        BoardService $boardService,
        ActivityService $activityService
    ) {
        $this->boardRepository = $boardRepository;
        $this->boardService = $boardService;
        $this->activityService = $activityService;
    }

    public function index(): JsonResponse
    {
        try {
            $boards = $this->boardRepository->forUser($this->getUser());
            return response()->json(BoardResource::collection($boards));
        } catch (\Exception $e) {
            Log::error('Failed to list boards: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve workspaces: ' . $e->getMessage()], 500);
        }
    }

    public function store(CreateBoardRequest $request): JsonResponse
    {
        try {
            $board = $this->boardService->createBoard($request->validated(), $this->getUser());
            return response()->json(new BoardResource($board), 201);
        } catch (\Exception $e) {
            Log::error('Failed to create board: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create workspace: ' . $e->getMessage()], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->findWithRelations($id);

            if (!$board || $board->user_id !== $this->getUser()->id) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            return response()->json(new BoardResource($board));
        } catch (\Exception $e) {
            Log::error("Failed to show board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load workspace details: ' . $e->getMessage()], 500);
        }
    }

    public function update(UpdateBoardRequest $request, int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->find($id);

            if (!$board || $board->user_id !== $this->getUser()->id) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            $this->boardRepository->update($board, $request->validated());
            $this->activityService->log(
                $board->id,
                'workspace_updated',
                "Updated workspace '{$board->name}'.",
                $this->getUser()
            );

            return response()->json(new BoardResource($board));
        } catch (\Exception $e) {
            Log::error("Failed to update board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to update workspace: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->find($id);

            if (!$board || $board->user_id !== $this->getUser()->id) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            $boardName = $board->name;
            $this->boardRepository->delete($board);

            return response()->json(['message' => 'Workspace deleted successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to delete board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete workspace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get activity logs for a specific board.
     */
    public function activities(Request $request, int $id): JsonResponse
    {
        try {
            $board = $this->boardRepository->find($id);

            if (!$board || $board->user_id !== $this->getUser()->id) {
                return response()->json(['message' => 'Workspace not found.'], 404);
            }

            $logs = $board->activityLogs()->limit(50)->get();
            return response()->json(ActivityLogResource::collection($logs));
        } catch (\Exception $e) {
            Log::error("Failed to load activities for board {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load activities.'], 500);
        }
    }

    protected function getUser()
    {
        return request()->attributes->get('auth_user');
    }
}
