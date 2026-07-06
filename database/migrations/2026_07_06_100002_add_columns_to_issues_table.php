<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('location_id')->constrained()->nullOnDelete();
            $table->string('priority')->default('medium')->after('category'); // low, medium, high, critical
            $table->string('reporter_name')->nullable()->after('description');
            $table->string('reporter_phone')->nullable()->after('reporter_name');
            $table->string('reporter_email')->nullable()->after('reporter_phone');
            $table->boolean('is_anonymous')->default(true)->after('photo_path');
            $table->integer('rating')->nullable()->after('resolved_at'); // 1-5 feedback rating
            $table->text('feedback_comment')->nullable()->after('rating');
            $table->timestamp('feedback_at')->nullable()->after('feedback_comment');
            $table->string('assigned_to')->nullable()->after('status');
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
