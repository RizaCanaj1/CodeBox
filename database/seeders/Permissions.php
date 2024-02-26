<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class Permissions extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions=['show','create','read','edit','update','delete'];
        $models=['users','post','grups','stories'];
        foreach($actions as $action){
            foreach($models as $model){
                Permission::create(['name'=>$action.' '.$model,'guard_name'=>'web']);
            }
        }
    }
}
