<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The original story_media table (see 2023_11_20_184102_create_story_media_table.php)
// was only ever a stub — id + timestamps, no columns, no data, nothing in
// the app ever wrote to it. Dropping it here (a new migration, rather than
// editing the old one) instead of building the real stories feature on top
// of it, since "story_media" doesn't fit a model where each row already
// *is* one story (see create_stories_table.php).
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('story_media');
    }

    public function down(): void
    {
        Schema::create('story_media', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }
};
