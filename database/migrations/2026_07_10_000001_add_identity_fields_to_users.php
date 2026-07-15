<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('identity_type')->nullable();
            $table->string('identity_number')->nullable();
            $table->string('identity_document_front')->nullable();
            $table->string('identity_document_back')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['identity_type', 'identity_number', 'identity_document_front', 'identity_document_back', 'phone', 'address']);
        });
    }
};
