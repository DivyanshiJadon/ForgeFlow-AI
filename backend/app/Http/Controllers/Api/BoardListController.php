<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateBoardListRequest;
use App\Http\Requests\Api\UpdateBoardListRequest;
use App\Http\Resources\Api\BoardListResource;
use App\Repositories\BoardList\BoardListRepositoryInterface;
use App\Services\Activity\ActivityService;
use App\Models\Board;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoardListController extends Controller
{
    protected $boardListRepository;
    protected $activityService;

    public function __construct(
        BoardListRepositoryInterface $boardListRepository,
        ActivityService $activityService
    ) {
        $this->boardListRepository = $boardListRepository;
        $this->activityService = $activityService;
    }

    public function store(CreateBoardListRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->attributes->get('auth_user');

        if (!isset($data['position'])) {
            $data['position'] = 0;
        }

        $list = $this->boardListRepository->create($data);

        $this->activityService->log(
            $data['board_id'],
            'list_created',
            "Created column '{$list->name}'.",
            $user
        );

        return response()->json(new BoardListResource($list), 201);
    }

    public function update(UpdateBoardListRequest $request, int $id): JsonResponse
    {
        $list = $this->boardListRepository->find($id);

        if (!$list) {
            return response()->json(['message' => 'List not found.'], 404);
        }

        $user = $request->attributes->get('auth_user');
        $oldName = $list->name;
        $this->boardListRepository->update($list, $request->validated());

        if (isset($request->validated()['name']) && $request->validated()['name'] !== $oldName) {
            $this->activityService->log(
                $list->board_id,
                'list_renamed',
                "Renamed column from '{$oldName}' to '{$list->name}'.",
                $user
            );
        }

        return response()->json(new BoardListResource($list));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $list = $this->boardListRepository->find($id);

        if (!$list) {
            return response()->json(['message' => 'List not found.'], 404);
        }

        $user = $request->attributes->get('auth_user');
        $boardId = $list->board_id;
        $listName = $list->name;

        $this->boardListRepository->delete($list);

        $this->activityService->log(
            $boardId,
            'list_deleted',
            "Deleted column '{$listName}'.",
            $user
        );

        return response()->json(['message' => 'List deleted successfully.']);
    }
}
