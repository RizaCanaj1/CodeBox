<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Two fields the startup wizard already collects (CV, and which post
// types you want to see) but had nowhere to actually save — see
// StartupController::upload_user().
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cv_path', 2048)->nullable()->after('profile_photo_path');
            $table->string('preferred_post_types')->nullable()->after('cv_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cv_path', 'preferred_post_types']);
        });
    }
};
