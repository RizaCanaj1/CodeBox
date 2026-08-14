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
        Schema::table('courses', function (Blueprint $table) {
            $table->string('languages')->nullable()->after('price');
            $table->integer('total_hours')->nullable()->after('languages');
            $table->string('schedule_days')->nullable()->after('total_hours');
            $table->string('schedule_time')->nullable()->after('schedule_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['languages', 'total_hours', 'schedule_days', 'schedule_time']);
        });
    }
};
