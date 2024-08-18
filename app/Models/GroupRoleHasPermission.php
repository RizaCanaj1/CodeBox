<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupRoleHasPermission extends Model
{
    use HasFactory;
    protected $fillable = [
        'group_id',
        'permissions_id'
    ];
}
