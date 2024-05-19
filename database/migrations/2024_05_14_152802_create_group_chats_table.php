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
        Schema::create('group_chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id');
            $table->unsignedBigInteger('from_user_id');
            $table->string('content');
            $table->unsignedBigInteger('replied_id')->nullable();
            $table->timestamps();
            $table->foreign('replied_id')->references('id')->on('group_chats');
            $table->foreign('from_user_id')->references('id')->on('users');
            $table->foreign('group_id')->references('id')->on('posts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_chats');
    }
};
