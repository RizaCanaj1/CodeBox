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
        Schema::create('post_invitations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('from_user_id');
            $table->unsignedBigInteger('receiver_user_id');
            $table->string('data_source')->nullable();
            $table->string('status');
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts');
            $table->foreign('from_user_id')->references('id')->on('users');
            $table->foreign('receiver_user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_invitations');
    }
};
