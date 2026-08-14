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

// Authentication routes
Route::post(
    '/v1/auth/register',
    [AuthController::class, 'register']
);

Route::post(
    '/v1/auth/login',
    [AuthController::class, 'login']
);

Route::post(
    '/v1/auth/logout',
    [AuthController::class, 'logout']
)->middleware([
    'auth:sanctum',
]);

Route::get(
    '/v1/auth/me',
    [AuthController::class, 'me']
)->middleware([
    'auth:sanctum',
    'active',
]);

Route::patch(
    '/v1/auth/profile',
    [AuthController::class, 'profile']
)->middleware([
    'auth:sanctum',
    'active',
]);

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
Route::get(
    '/v1/super-admin/hotels',
    [SuperAdminController::class, 'hotels']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::post(
    '/v1/super-admin/hotels',
    [SuperAdminController::class, 'createHotel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::get(
    '/v1/super-admin/hotels/{hotel}',
    [SuperAdminController::class, 'hotel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::patch(
    '/v1/super-admin/hotels/{hotel}',
    [SuperAdminController::class, 'updateHotel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::patch(
    '/v1/super-admin/hotels/{hotel}/status',
    [SuperAdminController::class, 'hotelStatus']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::get(
    '/v1/super-admin/hotels/{hotel}/managers',
    [SuperAdminController::class, 'managers']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::post(
    '/v1/super-admin/hotels/{hotel}/managers',
    [SuperAdminController::class, 'createManager']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::get(
    '/v1/super-admin/managers/{manager}',
    [SuperAdminController::class, 'showManager']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::patch(
    '/v1/super-admin/managers/{manager}',
    [SuperAdminController::class, 'updateManager']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::patch(
    '/v1/super-admin/managers/{manager}/status',
    [SuperAdminController::class, 'managerStatus']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::get(
    '/v1/super-admin/reports',
    [SuperAdminController::class, 'reports']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

Route::get(
    '/v1/super-admin/audit-logs',
    [SuperAdminController::class, 'auditLogs']
)->middleware([
    'auth:sanctum',
    'active',
    'role:super_admin',
]);

// Manager routes
Route::get(
    '/v1/manager/hotel',
    [ManagerController::class, 'hotel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::patch(
    '/v1/manager/hotel',
    [ManagerController::class, 'updateHotel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/receptionists',
    [ManagerController::class, 'receptionists']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::post(
    '/v1/manager/receptionists',
    [ManagerController::class, 'createReceptionist']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/receptionists/{receptionist}',
    [ManagerController::class, 'receptionist']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::patch(
    '/v1/manager/receptionists/{receptionist}',
    [ManagerController::class, 'updateReceptionist']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::patch(
    '/v1/manager/receptionists/{receptionist}/status',
    [ManagerController::class, 'receptionistStatus']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/room-types',
    [ManagerController::class, 'roomTypes']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::post(
    '/v1/manager/room-types',
    [ManagerController::class, 'createRoomType']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/room-types/{roomType}',
    [ManagerController::class, 'roomType']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::patch(
    '/v1/manager/room-types/{roomType}',
    [ManagerController::class, 'updateRoomType']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::patch(
    '/v1/manager/room-types/{roomType}/status',
    [ManagerController::class, 'roomTypeStatus']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/reservations',
    [ManagerController::class, 'reservations']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/payments',
    [ManagerController::class, 'payments']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/invoices',
    [InvoiceController::class, 'managerIndex']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/invoices/{invoice}',
    [InvoiceController::class, 'managerShow']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);

Route::get(
    '/v1/manager/reports',
    [ManagerController::class, 'reports']
)->middleware([
    'auth:sanctum',
    'active',
    'role:hotel_manager',
]);



// Guest reservation routes
Route::get(
    '/v1/guest/reservations',
    [GuestReservationController::class, 'index']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::post(
    '/v1/guest/reservations',
    [GuestReservationController::class, 'store']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::get(
    '/v1/guest/reservations/{reservation}',
    [GuestReservationController::class, 'show']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::post(
    '/v1/guest/reservations/{reservation}/cancel',
    [GuestReservationController::class, 'cancel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::get(
    '/v1/guest/reservations/{reservation}/invoice',
    [InvoiceController::class, 'guestShow']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

// Guest payment routes
Route::get(
    '/v1/guest/reservations/{reservation}/payments',
    [PaymentController::class, 'guestIndex']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::post(
    '/v1/guest/reservations/{reservation}/payments',
    [PaymentController::class, 'guestStore']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

Route::get(
    '/v1/guest/payments/{payment}',
    [PaymentController::class, 'guestShow']
)->middleware([
    'auth:sanctum',
    'active',
    'role:guest',
]);

// Simulated payment route
// TODO: Allow simulated payment only in the local environment.
Route::post(
    '/v1/payments/{payment}/simulate',
    [PaymentController::class, 'simulate']
)->middleware([
    'auth:sanctum',
    'active',
]);

// Receptionist routes
Route::get(
    '/v1/receptionist/reservations',
    [ReceptionistController::class, 'index']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::post(
    '/v1/receptionist/reservations',
    [ReceptionistController::class, 'store']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::get(
    '/v1/receptionist/reservations/{reservation}',
    [ReceptionistController::class, 'show']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::patch(
    '/v1/receptionist/reservations/{reservation}',
    [ReceptionistController::class, 'update']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::post(
    '/v1/receptionist/reservations/{reservation}/cancel',
    [ReceptionistController::class, 'cancel']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::get(
    '/v1/receptionist/reservations/{reservation}/payments',
    [ReceptionistController::class, 'payments']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::post(
    '/v1/receptionist/reservations/{reservation}/payments',
    [ReceptionistController::class, 'recordPayment']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::get(
    '/v1/receptionist/reservations/{reservation}/invoice',
    [InvoiceController::class, 'receptionistShow']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::post(
    '/v1/receptionist/reservations/{reservation}/check-in',
    [ReceptionistController::class, 'checkIn']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]);

Route::post(
    '/v1/receptionist/reservations/{reservation}/check-out',
    [ReceptionistController::class, 'checkOut']
)->middleware([
    'auth:sanctum',
    'active',
    'role:receptionist',
]); 