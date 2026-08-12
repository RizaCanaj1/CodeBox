<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupRoleFolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_role_id',
        'folder_name',
    ];

    public function role()
    {
        return $this->belongsTo(GroupRoles::class, 'group_role_id');
    }
}
