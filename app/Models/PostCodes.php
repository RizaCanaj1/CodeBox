<?php

namespace App\Models;

use App\Models\Posts;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PostCodes extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'source',
    ];

    public function post() {
        return $this->belongsTo(Posts::class);
    }
}
