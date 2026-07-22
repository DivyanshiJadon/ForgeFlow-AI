<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['card_id', 'content', 'author_name'];

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}