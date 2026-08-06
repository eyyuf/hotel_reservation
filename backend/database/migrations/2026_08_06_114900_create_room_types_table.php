<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('base_price', 12, 2);
            $table->unsignedSmallInteger('capacity');
            $table->unsignedInteger('total_rooms');

            $table->string('status', 20)->default('active');

            $table->timestamps();

            $table->unique(['hotel_id', 'name']);
            $table->index(['hotel_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_types');
    }
};
