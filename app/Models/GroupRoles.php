<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupRoles extends Model
{
    use HasFactory;
    protected $fillable = [
        'group_id',
        'name',
        'from_user_id',
        'can_manage_files'
    ];

    protected $casts = [
        'can_manage_files' => 'boolean',
    ];

    public function folders()
    {
        return $this->hasMany(GroupRoleFolder::class, 'group_role_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_role_user', 'group_role_id', 'user_id');
    }
}
