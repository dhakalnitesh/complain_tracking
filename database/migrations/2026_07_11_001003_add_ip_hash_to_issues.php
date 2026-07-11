<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->string('reporter_ip_hash', 64)->nullable()->after('reporter_ip');
            $table->index('reporter_ip_hash');
        });
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropIndex(['reporter_ip_hash']);
            $table->dropColumn('reporter_ip_hash');
        });
    }
};
