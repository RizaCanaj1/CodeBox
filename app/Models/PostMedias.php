<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostMedias extends Model
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
