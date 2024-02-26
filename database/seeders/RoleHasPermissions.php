<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;

class RoleHasPermissions extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = Role::all();
        foreach($roles as $role) {
            switch($role->name) {
                case 'admin':
                    $permissions = Permission::all();
                    foreach($permissions as $permission) {
                        $role->givePermissionTo($permission);
                    }
                    break;
                case 'company':
                    $permissions = Permission::where('name', 'not like', 'show%')->get();
                    foreach($permissions as $permission) {
                        $role->givePermissionTo($permission);
                    }
                    break;
                case 'programmer':
                    $permissions = Permission::where('name', 'not like', 'show%')->where('name', 'not like', '%users')->where('name', 'not like', '% grups')->get();
                    foreach($permissions as $permission) {
                        $role->givePermissionTo($permission);
                    }
                    break;
            }
        }
    }
}
