<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A role with zero rows here is unrestricted (sees every folder).
        // Checking any folder for a role scopes that role to only those
        // top-level Code/ folders — see Posts::allowedFoldersFor().
        Schema::create('group_role_folders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_role_id');
            $table->string('folder_name');
            $table->timestamps();
            $table->foreign('group_role_id')->references('id')->on('group_roles')->onDelete('cascade');
            $table->unique(['group_role_id', 'folder_name']);
        });

        // group_roles previously only recorded who *created* a role
        // definition (from_user_id) — there was no table actually assigning
        // a role to a member. This is that table. A member can hold several
        // roles at once.
        Schema::create('group_role_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_role_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->foreign('group_role_id')->references('id')->on('group_roles')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['group_role_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_role_user');
        Schema::dropIfExists('group_role_folders');
    }
};
