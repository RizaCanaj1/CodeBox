<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BugHunterSubmission extends Model
{
    protected $fillable = ['user_id', 'title', 'language', 'course_id', 'bugged_code', 'fixed_code', 'status', 'report_count'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Courses::class, 'course_id');
    }
}
