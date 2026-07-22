<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\BoardList;
use App\Models\Card;
use App\Models\Comment;
use App\Models\Member;
use App\Models\Tag;
use Illuminate\Http\Request;

class KanbanController extends Controller
{
    // --- BOARDS ---
    public function getBoards()
    {
        return response()->json(Board::all());
    }

    public function createBoard(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $board = Board::create($validated);
        
        // Seed default lists for convenience
        BoardList::create(['board_id' => $board->id, 'name' => 'To Do', 'position' => 1]);
        BoardList::create(['board_id' => $board->id, 'name' => 'In Progress', 'position' => 2]);
        BoardList::create(['board_id' => $board->id, 'name' => 'Done', 'position' => 3]);

        return response()->json($board->load('lists.cards'), 201);
    }

    public function getBoard($id)
    {
        $board = Board::with([
            'lists.cards.member',
            'lists.cards.tags',
            'lists.cards.comments'
        ])->findOrFail($id);

        return response()->json($board);
    }

    public function deleteBoard($id)
    {
        Board::findOrFail($id)->delete();
        return response()->json(['message' => 'Board deleted successfully']);
    }

    // --- LISTS ---
    public function createList(Request $request)
    {
        $validated = $request->validate([
            'board_id' => 'required|exists:boards,id',
            'name' => 'required|string|max:255',
            'position' => 'integer',
        ]);
        $list = BoardList::create($validated);
        return response()->json($list->load('cards'), 201);
    }

    public function updateList(Request $request, $id)
    {
        $list = BoardList::findOrFail($id);
        $validated = $request->validate([
            'name' => 'string|max:255',
            'position' => 'integer',
        ]);
        $list->update($validated);
        return response()->json($list);
    }

    public function deleteList($id)
    {
        BoardList::findOrFail($id)->delete();
        return response()->json(['message' => 'List deleted successfully']);
    }

    // --- CARDS ---
    public function createCard(Request $request)
    {
        $validated = $request->validate([
            'board_list_id' => 'required|exists:board_lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'member_id' => 'nullable|exists:members,id',
            'position' => 'integer',
        ]);

        $card = Card::create($validated);
        return response()->json($card->load(['member', 'tags', 'comments']), 201);
    }

    public function updateCard(Request $request, $id)
    {
        $card = Card::findOrFail($id);
        
        $validated = $request->validate([
            'board_list_id' => 'exists:board_lists,id',
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'member_id' => 'nullable|exists:members,id',
            'position' => 'integer',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $card->update($request->only(['board_list_id', 'title', 'description', 'due_date', 'member_id', 'position']));

        if ($request->has('tags')) {
            $card->tags()->sync($request->tags);
        }

        return response()->json($card->load(['member', 'tags', 'comments']));
    }

    public function deleteCard($id)
    {
        Card::findOrFail($id)->delete();
        return response()->json(['message' => 'Card deleted successfully']);
    }

    // --- MEMBERS ---
    public function getMembers()
    {
        return response()->json(Member::all());
    }

    public function createMember(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:members,email',
            'avatar_color' => 'string',
        ]);
        $member = Member::create($validated);
        return response()->json($member, 201);
    }

    // --- TAGS ---
    public function getTags()
    {
        return response()->json(Tag::all());
    }

    public function createTag(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:tags,name|max:50',
            'color' => 'required|string',
        ]);
        $tag = Tag::create($validated);
        return response()->json($tag, 201);
    }

    // --- COMMENTS ---
    public function createComment(Request $request, $cardId)
    {
        $card = Card::findOrFail($cardId);
        $validated = $request->validate([
            'content' => 'required|string',
            'author_name' => 'string',
        ]);
        
        $comment = $card->comments()->create($validated);
        return response()->json($comment, 201);
    }
}