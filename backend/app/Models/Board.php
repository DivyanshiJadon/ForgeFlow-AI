<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'title',
        'description',
        'color',
        'icon',
    ];

    /**
     * Auto-sync name and title properties on save to ensure backward compatibility.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($board) {
            if (empty($board->title) && !empty($board->name)) {
                $board->title = $board->name;
            } elseif (empty($board->name) && !empty($board->title)) {
                $board->name = $board->title;
            }
        });
    }

    /**
     * Get the lists (columns) for this board.
     */
    public function lists()
    {
        return $this->hasMany(BoardList::class)->orderBy('position');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the members assigned to this board.
     */
    public function members()
    {
        return $this->belongsToMany(Member::class, 'board_members', 'board_id', 'member_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the activity logs for this board.
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Fallback task relation to keep Laravel compatibility.
     * Maps through board lists to cards.
     */
    public function tasks()
    {
        return $this->hasManyThrough(Card::class, BoardList::class, 'board_id', 'board_list_id');
    }
}