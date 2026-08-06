<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('invoice_id')
                ->constrained('invoices')
                ->restrictOnDelete();

            $table->foreignId('recorded_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->decimal('amount', 12, 2);

            $table->string('payment_method', 30);
            $table->string('payment_channel', 30);

            $table->string('status', 20)->default('pending');

            $table->string('transaction_reference')
                ->nullable()
                ->unique();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index(['invoice_id', 'status']);
            $table->index(['payment_method', 'payment_channel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
