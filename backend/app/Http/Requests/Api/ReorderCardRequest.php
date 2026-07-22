<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ReorderCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'board_list_id' => 'required|exists:board_lists,id',
            'position' => 'required|integer|min:1',
        ];
    }
}
