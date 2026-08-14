<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('group_roles', function (Blueprint $table) {
            $table->boolean('can_download')->default(false)->after('can_manage_files');
            // Nullable — a role with no color falls back to the fixed
            // --role_color default client-side, so existing roles keep
            // rendering exactly as they do today.
            $table->string('color', 7)->nullable()->after('can_download');
        });
    }

    public function down(): void
    {
        Schema::table('group_roles', function (Blueprint $table) {
            $table->dropColumn(['can_download', 'color']);
        });
    }
};
