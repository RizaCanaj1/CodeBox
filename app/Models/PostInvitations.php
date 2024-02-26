<?php

namespace App\Models;

use App\Models\Posts;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PostInvitations extends Model
{
    use HasFactory;
    protected $fillable = [
        'post_id',
        'from_user_id',
        'receiver_user_id',
        'data_source',
        'status'
    ];

    public function post() {
        return $this->belongsTo(Posts::class);
    }
    public function user() {
        return $this->belongsTo(User::class, 'from_user_id', 'id');
    }
}
