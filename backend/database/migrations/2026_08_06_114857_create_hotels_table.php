<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('address');
            $table->string('city');
            $table->string('country')->default('Ethiopia');

            $table->string('status', 20)->default('active');

            $table->timestamps();

            $table->index(['city', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
