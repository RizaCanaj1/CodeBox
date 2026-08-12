<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupTodo extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'title',
        'is_done',
        'created_by',
        'assigned_to',
    ];

    protected $casts = [
        'is_done' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
