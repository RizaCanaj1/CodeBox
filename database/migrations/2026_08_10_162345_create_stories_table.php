<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type'); // 'image' | 'video'
            $table->string('source'); // filename under storage/app/public/stories
            $table->string('caption')->nullable();
            // Saved stories ("highlights") never expire out of the feed
            // query — see Story::scopeActive().
            $table->boolean('is_highlight')->default(false);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};
