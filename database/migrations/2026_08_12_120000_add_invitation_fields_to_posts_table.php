<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('programming_languages')->nullable()->after('content');
            $table->string('working_hours')->nullable()->after('programming_languages');
            $table->string('payment')->nullable()->after('working_hours');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['programming_languages', 'working_hours', 'payment']);
        });
    }
};
