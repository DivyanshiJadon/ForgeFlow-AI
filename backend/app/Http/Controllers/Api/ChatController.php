<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\Board;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * List all chat sessions for a board.
     */
    public function indexSessions(Request $request, int $boardId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $board = Board::find($boardId);

        if (!$board || $board->user_id !== $user->id) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }

        $sessions = ChatSession::where('board_id', $boardId)
            ->orWhere(function ($q) use ($user) {
                $q->whereNull('board_id')->where('user_id', $user->id);
            })
            ->with('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Create a new chat session for a board.
     */
    public function storeSession(Request $request, int $boardId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $board = Board::find($boardId);

        if (!$board || $board->user_id !== $user->id) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $session = ChatSession::create([
            'board_id' => $boardId,
            'user_id' => $user->id,
            'title' => $validated['title'] ?? 'New Chat',
        ]);

        return response()->json($session, 201);
    }

    /**
     * List all of the user's chat sessions (global, no board filter).
     */
    public function indexGlobalSessions(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $sessions = ChatSession::where('user_id', $user->id)
            ->with('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Create a new chat session without a board (global).
     */
    public function storeGlobalSession(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $session = ChatSession::create([
            'board_id' => null,
            'user_id' => $user->id,
            'title' => $validated['title'] ?? 'New Chat',
        ]);

        return response()->json($session, 201);
    }

    /**
     * Get a single chat session with all its messages.
     */
    public function showSession(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $session = ChatSession::with('messages')->find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Chat session not found.'], 404);
        }

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($session);
    }

    /**
     * Update a chat session (rename).
     */
    public function updateSession(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $session = ChatSession::find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Chat session not found.'], 404);
        }

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $session->update(['title' => $validated['title']]);

        return response()->json($session);
    }

    /**
     * Delete a chat session.
     */
    public function destroySession(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $session = ChatSession::find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Chat session not found.'], 404);
        }

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $session->delete();

        return response()->json(['message' => 'Chat session deleted.']);
    }

    /**
     * Get messages for a chat session.
     */
    public function indexMessages(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $session = ChatSession::find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Chat session not found.'], 404);
        }

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a message in a chat session.
     */
    public function storeMessage(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $session = ChatSession::find($sessionId);

        if (!$session) {
            return response()->json(['message' => 'Chat session not found.'], 404);
        }

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:user,assistant,system',
            'content' => 'required|string',
        ]);

        $message = ChatMessage::create([
            'session_id' => $sessionId,
            'role' => $validated['role'],
            'content' => $validated['content'],
        ]);

        $session->touch();

        return response()->json($message, 201);
    }
}
