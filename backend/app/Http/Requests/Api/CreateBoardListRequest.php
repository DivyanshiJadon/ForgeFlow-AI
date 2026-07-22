<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CreateBoardListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'board_id' => 'required|exists:boards,id',
            'name' => 'required|string|max:255',
            'position' => 'nullable|integer|min:0',
        ];
    }
}
