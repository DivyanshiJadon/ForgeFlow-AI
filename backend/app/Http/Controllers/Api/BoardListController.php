<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateBoardListRequest;
use App\Http\Requests\Api\UpdateBoardListRequest;
use App\Http\Resources\Api\BoardListResource;
use App\Repositories\BoardList\BoardListRepositoryInterface;
use Illuminate\Http\JsonResponse;

class BoardListController extends Controller
{
    protected $boardListRepository;

    public function __construct(BoardListRepositoryInterface $boardListRepository)
    {
        $this->boardListRepository = $boardListRepository;
    }

    /**
     * Create a new column/list in a board.
     */
    public function store(CreateBoardListRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        if (!isset($data['position'])) {
            $data['position'] = 0;
        }

        $list = $this->boardListRepository->create($data);

        return response()->json(new BoardListResource($list), 201);
    }

    /**
     * Update list details (name/position).
     */
    public function update(UpdateBoardListRequest $request, int $id): JsonResponse
    {
        $list = $this->boardListRepository->find($id);

        if (!$list) {
            return response()->json(['message' => 'List not found.'], 404);
        }

        $this->boardListRepository->update($list, $request->validated());

        return response()->json(new BoardListResource($list));
    }

    /**
     * Delete a list/column.
     */
    public function destroy(int $id): JsonResponse
    {
        $list = $this->boardListRepository->find($id);

        if (!$list) {
            return response()->json(['message' => 'List not found.'], 404);
        }

        $this->boardListRepository->delete($list);

        return response()->json(['message' => 'List deleted successfully.']);
    }
}
