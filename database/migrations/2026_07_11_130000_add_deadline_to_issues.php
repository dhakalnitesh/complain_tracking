<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->timestamp('deadline_at')->nullable()->after('resolved_at');
            $table->timestamp('extension_deadline_at')->nullable()->after('deadline_at');
        });
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn(['deadline_at', 'extension_deadline_at']);
        });
    }
};
