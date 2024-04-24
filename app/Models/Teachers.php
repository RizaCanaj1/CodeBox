<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teachers extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'profile_photo_path',
        'bio'
    ];
    use HasFactory;
}
