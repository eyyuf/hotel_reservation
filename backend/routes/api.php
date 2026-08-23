<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\GuestReservationController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PublicHotelController;
use App\Http\Controllers\Api\V1\ReceptionistController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::patch('profile', [AuthController::class, 'profile']);
    });
});

/*
|--------------------------------------------------------------------------
| Public hotel routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/hotels')->group(function () {
    Route::get('/', [PublicHotelController::class, 'index']);
    Route::get('{hotel}', [PublicHotelController::class, 'show']);
    Route::get('{hotel}/room-types', [PublicHotelController::class, 'roomTypes']);
    Route::get('{hotel}/room-types/{roomType}', [PublicHotelController::class, 'roomType']);
    Route::get('{hotel}/availability', [PublicHotelController::class, 'availability']);
});

/*
|--------------------------------------------------------------------------
| Super-admin routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/super-admin')
    ->middleware(['auth:sanctum', 'active', 'role:super_admin'])
    ->group(function () {
        Route::get('hotels', [SuperAdminController::class, 'hotels']);
        Route::post('hotels', [SuperAdminController::class, 'createHotel']);
        Route::get('hotels/{hotel}', [SuperAdminController::class, 'hotel']);
        Route::patch('hotels/{hotel}', [SuperAdminController::class, 'updateHotel']);
        Route::patch('hotels/{hotel}/status', [SuperAdminController::class, 'hotelStatus']);

        Route::get('hotels/{hotel}/managers', [SuperAdminController::class, 'managers']);
        Route::post('hotels/{hotel}/managers', [SuperAdminController::class, 'createManager']);
        Route::get('managers/{manager}', [SuperAdminController::class, 'showManager']);
        Route::patch('managers/{manager}', [SuperAdminController::class, 'updateManager']);
        Route::patch('managers/{manager}/status', [SuperAdminController::class, 'managerStatus']);

        Route::get('reports', [SuperAdminController::class, 'reports']);
    });

/*
|--------------------------------------------------------------------------
| Manager routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/manager')
    ->middleware(['auth:sanctum', 'active', 'role:hotel_manager'])
    ->group(function () {
        Route::get('hotel', [ManagerController::class, 'hotel']);
        Route::patch('hotel', [ManagerController::class, 'updateHotel']);

        Route::get('receptionists', [ManagerController::class, 'receptionists']);
        Route::post('receptionists', [ManagerController::class, 'createReceptionist']);
        Route::get('receptionists/{receptionist}', [ManagerController::class, 'receptionist']);
        Route::patch('receptionists/{receptionist}', [ManagerController::class, 'updateReceptionist']);
        Route::patch('receptionists/{receptionist}/status', [ManagerController::class, 'receptionistStatus']);

        Route::get('room-types', [ManagerController::class, 'roomTypes']);
        Route::post('room-types', [ManagerController::class, 'createRoomType']);
        Route::get('room-types/{roomType}', [ManagerController::class, 'roomType']);
        Route::patch('room-types/{roomType}', [ManagerController::class, 'updateRoomType']);
        Route::patch('room-types/{roomType}/status', [ManagerController::class, 'roomTypeStatus']);

        Route::get('reservations', [ManagerController::class, 'reservations']);
        Route::get('payments', [ManagerController::class, 'payments']);

        Route::get('invoices', [InvoiceController::class, 'managerIndex']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'managerShow']);

        Route::get('reports', [ManagerController::class, 'reports']);
    });

/*
|--------------------------------------------------------------------------
| Guest routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/guest')
    ->middleware(['auth:sanctum', 'active', 'role:guest'])
    ->group(function () {
        Route::get('reservations', [GuestReservationController::class, 'index']);
        Route::post('reservations', [GuestReservationController::class, 'store']);
        Route::get('reservations/{reservation}', [GuestReservationController::class, 'show']);
        Route::post('reservations/{reservation}/cancel', [GuestReservationController::class, 'cancel']);
        Route::get('reservations/{reservation}/invoice', [InvoiceController::class, 'guestShow']);

        Route::get('reservations/{reservation}/payments', [PaymentController::class, 'guestIndex']);
        Route::post('reservations/{reservation}/payments', [PaymentController::class, 'guestStore']);
        Route::get('payments/{payment}', [PaymentController::class, 'guestShow']);
    });

/*
|--------------------------------------------------------------------------
| Receptionist routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/receptionist')
    ->middleware(['auth:sanctum', 'active', 'role:receptionist'])
    ->group(function () {
        Route::get('reservations', [ReceptionistController::class, 'index']);
        Route::post('reservations', [ReceptionistController::class, 'store']);
        Route::get('reservations/{reservation}', [ReceptionistController::class, 'show']);
        Route::patch('reservations/{reservation}', [ReceptionistController::class, 'update']);
        Route::post('reservations/{reservation}/cancel', [ReceptionistController::class, 'cancel']);
        Route::post('reservations/{reservation}/check-in', [ReceptionistController::class, 'checkIn']);
        Route::post('reservations/{reservation}/check-out', [ReceptionistController::class, 'checkOut']);

        Route::get('reservations/{reservation}/payments', [ReceptionistController::class, 'payments']);
        Route::post('reservations/{reservation}/payments', [ReceptionistController::class, 'recordPayment']);
        Route::get('reservations/{reservation}/invoice', [InvoiceController::class, 'receptionistShow']);
    });

/*
|--------------------------------------------------------------------------
| Simulated payment route
|--------------------------------------------------------------------------
| TODO: Restrict to the local environment only (e.g. wrap in
| app()->environment('local') or gate behind a dedicated
| 'role:can_simulate_payment' / config flag) before deploying —
| currently reachable by any authenticated, active user regardless
| of role or environment.
*/
Route::post('/v1/payments/{payment}/simulate', [PaymentController::class, 'simulate'])
    ->middleware(['auth:sanctum', 'active']);