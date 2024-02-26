<?php

namespace App\Models;

use App\Models\User;
use App\Models\Posts;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PostComments extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'source',
    ];
    public function user() {
        return $this->belongsTo(User::class);
    }
    public function post() {
        return $this->belongsTo(Posts::class);
    }
}
