<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hotel_id')->nullable()->constrained('hotels')->restrictOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');

            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->string('password');

            $table->string('role', 30)->default('guest');
            $table->string('status', 20)->default('active');

            $table->rememberToken();
            $table->timestamps();

            $table->index(['hotel_id', 'role', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
