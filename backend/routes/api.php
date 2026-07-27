<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\BoardListController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\ChatController;

// Public auth routes
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth.api')->group(function () {

    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);

    // Board Workspaces CRUD
    Route::apiResource('boards', BoardController::class);

    // Board Activity Logs
    Route::get('boards/{id}/activities', [BoardController::class, 'activities']);

    // Lists / Columns Management
    Route::post('lists', [BoardListController::class, 'store']);
    Route::put('lists/{id}', [BoardListController::class, 'update']);
    Route::delete('lists/{id}', [BoardListController::class, 'destroy']);

    // Cards / Tasks CRUD
    Route::apiResource('cards', CardController::class);
    Route::post('cards/{id}/reorder', [CardController::class, 'reorder']);

    // Card Comments
    Route::post('cards/{cardId}/comments', [CommentController::class, 'store']);

    // AI Assistant Integration
    Route::post('ai/chat', [AIController::class, 'chat']);
    Route::get('ai/config', [AIController::class, 'config']);

    // AI Chat Sessions (per workspace)
    Route::get('boards/{boardId}/chat-sessions', [ChatController::class, 'indexSessions']);
    Route::post('boards/{boardId}/chat-sessions', [ChatController::class, 'storeSession']);
    Route::get('chat-sessions/{sessionId}', [ChatController::class, 'showSession']);
    Route::put('chat-sessions/{sessionId}', [ChatController::class, 'updateSession']);
    Route::delete('chat-sessions/{sessionId}', [ChatController::class, 'destroySession']);

    // Chat Messages
    Route::get('chat-sessions/{sessionId}/messages', [ChatController::class, 'indexMessages']);
    Route::post('chat-sessions/{sessionId}/messages', [ChatController::class, 'storeMessage']);
});
