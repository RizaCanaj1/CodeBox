<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Courses extends Model
{
    use HasFactory;
    protected $fillable = [
        'teacher_id',
        'name',
        'description',
        'price',
        'languages',
        'total_hours',
        'schedule_days',
        'schedule_time',
        'profile_photo_path',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teachers::class, 'teacher_id');
    }
}
