<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'board_list_id' => $this->board_list_id,
            'member_id' => $this->member_id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority ?? 'medium',
            'due_date' => $this->due_date?->toIso8601String(),
            'position' => $this->position,
            'member' => new MemberResource($this->whenLoaded('member')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
