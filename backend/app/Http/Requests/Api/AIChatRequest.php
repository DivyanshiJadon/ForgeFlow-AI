<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AIChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => 'nullable|string',
            'board_id' => 'nullable|integer',
            'session_id' => 'nullable|integer|exists:ai_chat_sessions,id',
            'messages' => 'nullable|array',
            'context' => 'nullable|array',
        ];
    }
}
