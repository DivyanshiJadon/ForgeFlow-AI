<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\BoardListController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AIController;

// 1. Board Workspaces CRUD
Route::apiResource('boards', BoardController::class);

// 2. Lists / Columns Management
Route::post('lists', [BoardListController::class, 'store']);
Route::put('lists/{id}', [BoardListController::class, 'update']);
Route::delete('lists/{id}', [BoardListController::class, 'destroy']);

// 3. Cards / Tasks CRUD
Route::apiResource('cards', CardController::class);
Route::post('cards/{id}/reorder', [CardController::class, 'reorder']);

// 4. Card Comments
Route::post('cards/{cardId}/comments', [CommentController::class, 'store']);

// 5. AI Assistant Integration
Route::post('ai/chat', [AIController::class, 'chat']);