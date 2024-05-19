<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserMedia extends Model
{
    protected $fillable = [
        'user_id',
        'social_media',
        'media_link'
    ];
    public function user() {
        return $this->belongsTo(User::class);
    }
    use HasFactory;
}
