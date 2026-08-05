<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\GuestReservationController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PublicHotelController;
use App\Http\Controllers\Api\V1\ReceptionistController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // TODO: Add authentication and account middleware where required.
    Route::prefix('auth')->controller(AuthController::class)->group(function (): void {
        Route::post('register', 'register');
        Route::post('login', 'login');
        Route::post('logout', 'logout');
        Route::get('me', 'me');
        Route::patch('profile', 'profile');
    });

    Route::controller(PublicHotelController::class)->group(function (): void {
        Route::get('hotels', 'index');
        Route::get('hotels/{hotel}', 'show');
        Route::get('hotels/{hotel}/room-types', 'roomTypes');
        Route::get('hotels/{hotel}/room-types/{roomType}', 'roomType');
        Route::get('hotels/{hotel}/availability', 'availability');
    });

    // TODO: Protect with auth:sanctum, active-account and super_admin role middleware.
    Route::prefix('super-admin')->controller(SuperAdminController::class)->group(function (): void {
        Route::get('hotels', 'hotels');
        Route::post('hotels', 'createHotel');
        Route::get('hotels/{hotel}', 'hotel');
        Route::patch('hotels/{hotel}', 'updateHotel');
        Route::patch('hotels/{hotel}/status', 'hotelStatus');
        Route::get('hotels/{hotel}/managers', 'managers');
        Route::post('hotels/{hotel}/managers', 'createManager');
        Route::get('managers/{manager}', 'showManager');
        Route::patch('managers/{manager}', 'updateManager');
        Route::patch('managers/{manager}/status', 'managerStatus');
        Route::get('reports', 'reports');
        Route::get('audit-logs', 'auditLogs');
    });

    // TODO: Protect with auth:sanctum, active-account and hotel_manager role middleware.
    Route::prefix('manager')->controller(ManagerController::class)->group(function (): void {
        Route::get('hotel', 'hotel');
        Route::patch('hotel', 'updateHotel');
        Route::get('receptionists', 'receptionists');
        Route::post('receptionists', 'createReceptionist');
        Route::get('receptionists/{receptionist}', 'receptionist');
        Route::patch('receptionists/{receptionist}', 'updateReceptionist');
        Route::patch('receptionists/{receptionist}/status', 'receptionistStatus');
        Route::get('room-types', 'roomTypes');
        Route::post('room-types', 'createRoomType');
        Route::get('room-types/{roomType}', 'roomType');
        Route::patch('room-types/{roomType}', 'updateRoomType');
        Route::patch('room-types/{roomType}/status', 'roomTypeStatus');
        Route::get('reservations', 'reservations');
        Route::get('payments', 'payments');
        Route::get('reports', 'reports');
        Route::get('audit-logs', 'auditLogs');
    });

    // TODO: Protect guest routes with future authentication and guest role middleware.
    Route::prefix('guest')->group(function (): void {
        Route::prefix('reservations')->controller(GuestReservationController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{reservation}', 'show');
            Route::post('{reservation}/cancel', 'cancel');
        });

        Route::controller(PaymentController::class)->group(function (): void {
            Route::get('reservations/{reservation}/payments', 'guestIndex');
            Route::post('reservations/{reservation}/payments', 'guestStore');
            Route::get('payments/{payment}', 'guestShow');
        });
    });

    // TODO: Restrict this development route with future middleware.
    Route::post('payments/{payment}/simulate', [PaymentController::class, 'simulate']);

    // TODO: Protect with future authentication, active-account and receptionist role middleware.
    Route::prefix('receptionist')->controller(ReceptionistController::class)->group(function (): void {
        Route::get('reservations', 'index');
        Route::post('reservations', 'store');
        Route::get('reservations/{reservation}', 'show');
        Route::patch('reservations/{reservation}', 'update');
        Route::post('reservations/{reservation}/cancel', 'cancel');
        Route::get('reservations/{reservation}/payments', 'payments');
        Route::post('reservations/{reservation}/payments', 'recordPayment');
        Route::post('reservations/{reservation}/check-in', 'checkIn');
        Route::post('reservations/{reservation}/check-out', 'checkOut');
    });
});
