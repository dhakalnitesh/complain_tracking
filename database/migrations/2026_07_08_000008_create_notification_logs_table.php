<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_id')->constrained()->cascadeOnDelete();
            $table->foreignId('issue_event_id')->nullable()->constrained('issue_events')->nullOnDelete();
            $table->string('channel'); // 'log' | 'mail'
            $table->string('recipient'); // phone number or email
            $table->string('message');
            $table->string('status')->default('pending'); // pending | sent | failed
            $table->text('response')->nullable(); // gateway response or error message
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['issue_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
