<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table): void {
            $table->id();

            $table->string('booking_reference')->unique();

            $table->foreignId('hotel_id')
                ->constrained('hotels')
                ->restrictOnDelete();

            $table->foreignId('guest_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('room_type_id')
                ->constrained('room_types')
                ->restrictOnDelete();

            $table->foreignId('created_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->date('check_in_date');
            $table->date('check_out_date');

            $table->unsignedSmallInteger('number_of_rooms')->default(1);
            $table->unsignedSmallInteger('adults')->default(1);
            $table->unsignedSmallInteger('children')->default(0);

            $table->decimal('nightly_rate', 12, 2);
            $table->decimal('total_amount', 12, 2);

            $table->string('status', 30)->default('pending');

            $table->text('special_requests')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->timestamps();

            $table->index(
                [
                    'room_type_id',
                    'check_in_date',
                    'check_out_date',
                    'status',
                ],
                'reservations_availability_index'
            );

            $table->index(
                ['hotel_id', 'status', 'check_in_date'],
                'reservations_hotel_status_index'
            );

            $table->index(['guest_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
