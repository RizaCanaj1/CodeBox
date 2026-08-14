<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BugHunterProgress extends Model
{
    protected $fillable = ['user_id', 'language', 'difficulty', 'best_score', 'completed_at'];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
