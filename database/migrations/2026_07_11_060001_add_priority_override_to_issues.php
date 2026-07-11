<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->string('user_priority', 20)->nullable()->after('priority');
            $table->string('admin_priority', 20)->nullable()->after('user_priority');
            $table->timestamp('priority_reviewed_at')->nullable()->after('admin_priority');
            $table->foreignId('priority_reviewed_by')->nullable()->constrained('users')->after('priority_reviewed_at');
        });

        DB::table('issues')->whereNull('user_priority')->update(['user_priority' => DB::raw('priority')]);
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('priority_reviewed_by');
            $table->dropColumn(['user_priority', 'admin_priority', 'priority_reviewed_at']);
        });
    }
};
