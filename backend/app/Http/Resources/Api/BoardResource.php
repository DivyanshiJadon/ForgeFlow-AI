<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BoardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name ?? $this->title,
            'description' => $this->description,
            'color' => $this->color ?? '#4F46E5',
            'icon' => $this->icon ?? 'LayoutGrid',
            'lists' => BoardListResource::collection($this->whenLoaded('lists')),
            'members' => MemberResource::collection($this->whenLoaded('members')),
            'activity_logs' => ActivityLogResource::collection($this->whenLoaded('activityLogs')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
