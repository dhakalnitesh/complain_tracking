<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('priority')->default('medium'); // low, medium, high, critical
            $table->string('reporter_name')->nullable();
            $table->string('reporter_phone')->nullable();
            $table->string('reporter_email')->nullable();
            $table->boolean('is_anonymous')->default(true);
            $table->integer('rating')->nullable(); // 1-5 feedback rating
            $table->text('feedback_comment')->nullable();
            $table->timestamp('feedback_at')->nullable();
            $table->string('assigned_to')->nullable();
            $table->index('organization_id');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn([
                'organization_id',
                'priority',
                'reporter_name',
                'reporter_phone',
                'reporter_email',
                'is_anonymous',
                'rating',
                'feedback_comment',
                'feedback_at',
                'assigned_to',
            ]);
        });
    }
};
