<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(int $boardId): JsonResponse
    {
        $board = Board::findOrFail($boardId);
        return response()->json($board->members);
    }

    public function store(Request $request, int $boardId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
        ]);

        $board = Board::findOrFail($boardId);

        $member = Member::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'avatar_color' => '#' . substr(md5($validated['email']), 0, 6),
            ]
        );

        if (!$board->members()->where('member_id', $member->id)->exists()) {
            $board->members()->attach($member->id, ['role' => 'member']);
        }

        return response()->json($member, 201);
    }

    public function destroy(int $boardId, int $memberId): JsonResponse
    {
        $board = Board::findOrFail($boardId);
        $board->members()->detach($memberId);
        return response()->json(['message' => 'Member removed from board.']);
    }
}
