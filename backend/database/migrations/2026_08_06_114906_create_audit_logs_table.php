<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hotel_id')
                ->nullable()
                ->constrained('hotels')
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('action', 100);

            $table->string('entity_type', 100)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();

            $table->text('description')->nullable();
            $table->json('metadata')->nullable();

            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            $table->index(['hotel_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
