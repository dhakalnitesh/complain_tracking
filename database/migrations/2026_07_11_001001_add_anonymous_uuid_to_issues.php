<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->string('anonymous_uuid', 36)->nullable();
            $table->index('anonymous_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropIndex(['anonymous_uuid']);
            $table->dropColumn('anonymous_uuid');
        });
    }
};
