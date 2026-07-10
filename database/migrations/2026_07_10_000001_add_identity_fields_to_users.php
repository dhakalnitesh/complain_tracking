<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('identity_type')->nullable()->after('is_staff');
            $table->string('identity_number')->nullable()->after('identity_type');
            $table->string('identity_document_front')->nullable()->after('identity_number');
            $table->string('identity_document_back')->nullable()->after('identity_document_front');
            $table->string('phone', 20)->nullable()->after('identity_document_back');
            $table->text('address')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['identity_type', 'identity_number', 'identity_document_front', 'identity_document_back', 'phone', 'address']);
        });
    }
};
