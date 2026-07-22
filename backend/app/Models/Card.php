<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_list_id',
        'member_id',
        'title',
        'description',
        'priority', // low, medium, high
        'due_date',
        'position',
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    /**
     * Get the column/list that owns the card.
     */
    public function boardList()
    {
        return $this->belongsTo(BoardList::class, 'board_list_id');
    }

    /**
     * Get the member assigned to the card.
     */
    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * Get the tags (labels) associated with the card.
     */
    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Get the comments for the card.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class)->orderBy('created_at', 'desc');
    }
}