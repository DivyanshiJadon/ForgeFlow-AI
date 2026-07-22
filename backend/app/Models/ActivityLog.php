<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'user_name',
        'action',
        'details',
    ];

    /**
     * Get the board associated with the log.
     */
    public function board()
    {
        return $this->belongsTo(Board::class);
    }
}
