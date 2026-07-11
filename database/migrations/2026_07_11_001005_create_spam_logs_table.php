<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spam_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->nullableMorphs('loggable');
            $table->string('uuid', 36)->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->float('spam_score')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spam_logs');
    }
};
