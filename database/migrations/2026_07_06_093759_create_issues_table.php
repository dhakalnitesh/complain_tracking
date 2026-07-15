<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->string('reference_code')->nullable()->unique();
            $table->string('category');
            $table->foreignId('location_id')->constrained();
            $table->text('description');
            $table->string('photo_path')->nullable();
            $table->string('status', 20)->default('received');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['category', 'location_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
