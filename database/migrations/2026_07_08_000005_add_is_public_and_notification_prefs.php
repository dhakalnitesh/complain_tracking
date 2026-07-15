<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issue_events', function (Blueprint $table) {
            $table->boolean('is_public')->default(false);
            $table->index('is_public');
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->boolean('sms_opt_in')->default(false);
            $table->index('sms_opt_in');
        });
    }

    public function down(): void
    {
        Schema::table('issue_events', function (Blueprint $table) {
            $table->dropColumn('is_public');
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn('sms_opt_in');
        });
    }
};
