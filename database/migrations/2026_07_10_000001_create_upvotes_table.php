<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upvotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('session_id', 100)->nullable();
            $table->foreignId('issue_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'issue_id']);
            $table->unique(['session_id', 'issue_id']);
            $table->index('issue_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upvotes');
    }
};
