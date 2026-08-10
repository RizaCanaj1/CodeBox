<?php

namespace App\Models;

use App\Models\User;
use App\Models\StoryView;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Story extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'source',
        'caption',
        'is_highlight',
        'expires_at',
    ];

    protected $casts = [
        'is_highlight' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function views()
    {
        return $this->hasMany(StoryView::class, 'story_id');
    }

    // Not-yet-expired OR explicitly kept as a highlight — the set of
    // stories that should still show up in the stories bar / a profile's
    // highlights.
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('expires_at', '>', now())->orWhere('is_highlight', true);
        });
    }
}
