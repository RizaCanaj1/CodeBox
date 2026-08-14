<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bug_hunter_submissions', function (Blueprint $table) {
            // Nullable — most uploads are public. Set only when a teacher
            // wants to restrict a puzzle to their own course (see
            // BugHunterController::puzzle() for the access check, and its
            // doc comment for the real limitation: there's no student
            // enrollment table in this app yet, so this can only verify
            // the requester IS the course's teacher, not that they're a
            // paying student).
            $table->foreignId('course_id')->nullable()->after('language')->constrained('courses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bug_hunter_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_id');
        });
    }
};
