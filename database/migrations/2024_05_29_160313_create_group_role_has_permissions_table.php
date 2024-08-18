<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('group_role_has_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('roles_id');
            $table->unsignedBigInteger('permissions_id');
            $table->foreign('roles_id')->references('id')->on('group_roles');
            $table->foreign('permissions_id')->references('id')->on('group_permissions');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_role_has_permissions');
    }
};
