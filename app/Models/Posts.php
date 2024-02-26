<?php

namespace App\Models;

use App\Models\User;
use App\Models\PostCodes;
use App\Models\PostMedias;
use App\Models\PostInvitations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Posts extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'content'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
    public function code(){
        return $this->hasMany(PostCodes::class, 'post_id');
    }
    public function media(){
        return $this->hasMany(PostMedias::class, 'post_id');
    }
    public function comments(){
        return $this->hasMany(PostComments::class, 'post_id');
    }
    public function invitations() {
        return $this->hasMany(PostInvitations::class,'post_id');
    }
}
