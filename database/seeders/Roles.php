<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class Roles extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['admin', 'company', 'programmer'];
        foreach($roles as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }
}