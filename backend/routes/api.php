<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\GuestReservationController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PublicHotelController;
use App\Http\Controllers\Api\V1\ReceptionistController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post(
    '/v1/auth/register',
    [AuthController::class, 'register']
);

Route::post(
    '/v1/auth/login',
    [AuthController::class, 'login']
);

// TODO: Protect logout, me and profile with auth:sanctum and active middleware.
Route::post(
    '/v1/auth/logout',
    [AuthController::class, 'logout']
);

Route::get(
    '/v1/auth/me',
    [AuthController::class, 'me']
);

Route::patch(
    '/v1/auth/profile',
    [AuthController::class, 'profile']
);

// Public hotel routes
Route::get(
    '/v1/hotels',
    [PublicHotelController::class, 'index']
);

Route::get(
    '/v1/hotels/{hotel}',
    [PublicHotelController::class, 'show']
);

Route::get(
    '/v1/hotels/{hotel}/room-types',
    [PublicHotelController::class, 'roomTypes']
);

Route::get(
    '/v1/hotels/{hotel}/room-types/{roomType}',
    [PublicHotelController::class, 'roomType']
);

Route::get(
    '/v1/hotels/{hotel}/availability',
    [PublicHotelController::class, 'availability']
);

// Super-admin routes
// TODO: Protect super-admin routes with:
// auth:sanctum, active and role:super_admin.
Route::get(
    '/v1/super-admin/hotels',
    [SuperAdminController::class, 'hotels']
);

Route::post(
    '/v1/super-admin/hotels',
    [SuperAdminController::class, 'createHotel']
);

Route::get(
    '/v1/super-admin/hotels/{hotel}',
    [SuperAdminController::class, 'hotel']
);

Route::patch(
    '/v1/super-admin/hotels/{hotel}',
    [SuperAdminController::class, 'updateHotel']
);

Route::patch(
    '/v1/super-admin/hotels/{hotel}/status',
    [SuperAdminController::class, 'hotelStatus']
);

Route::get(
    '/v1/super-admin/hotels/{hotel}/managers',
    [SuperAdminController::class, 'managers']
);

Route::post(
    '/v1/super-admin/hotels/{hotel}/managers',
    [SuperAdminController::class, 'createManager']
);

Route::get(
    '/v1/super-admin/managers/{manager}',
    [SuperAdminController::class, 'showManager']
);

Route::patch(
    '/v1/super-admin/managers/{manager}',
    [SuperAdminController::class, 'updateManager']
);

Route::patch(
    '/v1/super-admin/managers/{manager}/status',
    [SuperAdminController::class, 'managerStatus']
);

Route::get(
    '/v1/super-admin/reports',
    [SuperAdminController::class, 'reports']
);

Route::get(
    '/v1/super-admin/audit-logs',
    [SuperAdminController::class, 'auditLogs']
);

// Manager routes
// TODO: Protect manager routes with:
// auth:sanctum, active and role:hotel_manager.
Route::get(
    '/v1/manager/hotel',
    [ManagerController::class, 'hotel']
);

Route::patch(
    '/v1/manager/hotel',
    [ManagerController::class, 'updateHotel']
);

Route::get(
    '/v1/manager/receptionists',
    [ManagerController::class, 'receptionists']
);

Route::post(
    '/v1/manager/receptionists',
    [ManagerController::class, 'createReceptionist']
);

Route::get(
    '/v1/manager/receptionists/{receptionist}',
    [ManagerController::class, 'receptionist']
);

Route::patch(
    '/v1/manager/receptionists/{receptionist}',
    [ManagerController::class, 'updateReceptionist']
);

Route::patch(
    '/v1/manager/receptionists/{receptionist}/status',
    [ManagerController::class, 'receptionistStatus']
);

Route::get(
    '/v1/manager/room-types',
    [ManagerController::class, 'roomTypes']
);

Route::post(
    '/v1/manager/room-types',
    [ManagerController::class, 'createRoomType']
);

Route::get(
    '/v1/manager/room-types/{roomType}',
    [ManagerController::class, 'roomType']
);

Route::patch(
    '/v1/manager/room-types/{roomType}',
    [ManagerController::class, 'updateRoomType']
);

Route::patch(
    '/v1/manager/room-types/{roomType}/status',
    [ManagerController::class, 'roomTypeStatus']
);

Route::get(
    '/v1/manager/reservations',
    [ManagerController::class, 'reservations']
);

Route::get(
    '/v1/manager/payments',
    [ManagerController::class, 'payments']
);

Route::get(
    '/v1/manager/reports',
    [ManagerController::class, 'reports']
);

Route::get(
    '/v1/manager/audit-logs',
    [ManagerController::class, 'auditLogs']
);

// Guest reservation routes
// TODO: Protect guest routes with:
// auth:sanctum, active and role:guest.
Route::get(
    '/v1/guest/reservations',
    [GuestReservationController::class, 'index']
);

Route::post(
    '/v1/guest/reservations',
    [GuestReservationController::class, 'store']
);

Route::get(
    '/v1/guest/reservations/{reservation}',
    [GuestReservationController::class, 'show']
);

Route::post(
    '/v1/guest/reservations/{reservation}/cancel',
    [GuestReservationController::class, 'cancel']
);

// Guest payment routes
Route::get(
    '/v1/guest/reservations/{reservation}/payments',
    [PaymentController::class, 'guestIndex']
);

Route::post(
    '/v1/guest/reservations/{reservation}/payments',
    [PaymentController::class, 'guestStore']
);

Route::get(
    '/v1/guest/payments/{payment}',
    [PaymentController::class, 'guestShow']
);

// Simulated payment route
// TODO: Allow simulated payment only in the local environment.
Route::post(
    '/v1/payments/{payment}/simulate',
    [PaymentController::class, 'simulate']
);

// Receptionist routes
// TODO: Protect receptionist routes with:
// auth:sanctum, active and role:receptionist.
Route::get(
    '/v1/receptionist/reservations',
    [ReceptionistController::class, 'index']
);

Route::post(
    '/v1/receptionist/reservations',
    [ReceptionistController::class, 'store']
);

Route::get(
    '/v1/receptionist/reservations/{reservation}',
    [ReceptionistController::class, 'show']
);

Route::patch(
    '/v1/receptionist/reservations/{reservation}',
    [ReceptionistController::class, 'update']
);

Route::post(
    '/v1/receptionist/reservations/{reservation}/cancel',
    [ReceptionistController::class, 'cancel']
);

Route::get(
    '/v1/receptionist/reservations/{reservation}/payments',
    [ReceptionistController::class, 'payments']
);

Route::post(
    '/v1/receptionist/reservations/{reservation}/payments',
    [ReceptionistController::class, 'recordPayment']
);

Route::post(
    '/v1/receptionist/reservations/{reservation}/check-in',
    [ReceptionistController::class, 'checkIn']
);

Route::post(
    '/v1/receptionist/reservations/{reservation}/check-out',
    [ReceptionistController::class, 'checkOut']
);
