<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\User;
use App\Models\Reservation;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class SuperAdminController extends Controller
{
    public function hotels(): JsonResponse
    {
        $hotels = Hotel::all();

        $data = $hotels->map(function ($hotel) {
            return [
                'hotel_id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'phone' => $hotel->phone,
                'email' => $hotel->email,
                'status' => $hotel->status,
            ];
        });

        return response()->json([
            'message' => 'Hotels retrieved successfully.',
            'data' => $data,
        ]);
    }

    public function createHotel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:hotels,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
        ]);

        $hotel = Hotel::create($validated);

        return response()->json([
            'message' => 'Hotel created successfully.',
            'data' => [
                'hotel_id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'phone' => $hotel->phone,
                'email' => $hotel->email,
                'status' => $hotel->status,
                'created_at' => $hotel->created_at,
                'updated_at' => $hotel->updated_at,
            ],
        ], 201);
    }

    public function hotel(Hotel $hotel): JsonResponse
    {
        return response()->json([
            'message' => 'Hotel retrieved successfully.',
            'data' => [
                'hotel_id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'phone' => $hotel->phone,
                'email' => $hotel->email,
                'status' => $hotel->status,
                'created_at' => $hotel->created_at,
                'updated_at' => $hotel->updated_at,
            ],
        ]);
    }

    public function updateHotel(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'country' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255|unique:hotels,email,' . $hotel->id,
        ]);

        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel updated successfully.',
            'data' => [
                'hotel_id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'phone' => $hotel->phone,
                'email' => $hotel->email,
                'status' => $hotel->status,
                'updated_at' => $hotel->updated_at,
            ],
        ]);
    }

    public function hotelStatus(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel status updated successfully.',
            'data' => [
                'hotel_id' => $hotel->id,
                'name' => $hotel->name,
                'status' => $hotel->status,
                'updated_at' => $hotel->updated_at,
            ],
        ]);
    }

    public function managers(Hotel $hotel): JsonResponse
    {
        $managers = $hotel->staff()
            ->where('role', 'hotel_manager')
            ->get();

        $data = $managers->map(function ($manager) {
            return [
                'user_id' => $manager->id,
                'hotel_id' => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name' => $manager->first_name,
                'last_name' => $manager->last_name,
                'email' => $manager->email,
                'phone' => $manager->phone,
                'role' => $manager->role,
                'account_status' => $manager->account_status,
            ];
        });

        return response()->json([
            'message' => 'Hotel managers retrieved successfully.',
            'data' => $data,
        ]);
    }

    public function createManager(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
        ]);

        $manager = $hotel->staff()->create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'hotel_manager',
            'account_status' => 'active',
            'created_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Hotel manager created successfully.',
            'data' => [
                'user_id' => $manager->id,
                'hotel_id' => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name' => $manager->first_name,
                'last_name' => $manager->last_name,
                'email' => $manager->email,
                'phone' => $manager->phone,
                'role' => $manager->role,
                'account_status' => $manager->account_status,
                'created_at' => $manager->created_at,
                'updated_at' => $manager->updated_at,
            ],
        ], 201);
    }

    public function showManager(User $manager): JsonResponse
    {
        if ($manager->role !== 'hotel_manager') {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Hotel manager retrieved successfully.',
            'data' => [
                'user_id' => $manager->id,
                'hotel_id' => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name' => $manager->first_name,
                'last_name' => $manager->last_name,
                'email' => $manager->email,
                'phone' => $manager->phone,
                'role' => $manager->role,
                'account_status' => $manager->account_status,
            ],
        ]);
    }

    public function updateManager(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== 'hotel_manager') {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $manager->id,
            'phone' => 'sometimes|nullable|string|max:20',
        ]);

        $manager->update($validated);

        return response()->json([
            'message' => 'Hotel manager updated successfully.',
            'data' => [
                'user_id' => $manager->id,
                'hotel_id' => $manager->hotel_id,
                'first_name' => $manager->first_name,
                'last_name' => $manager->last_name,
                'email' => $manager->email,
                'phone' => $manager->phone,
                'role' => $manager->role,
                'account_status' => $manager->account_status,
                'updated_at' => $manager->updated_at,
            ],
        ]);
    }

    public function managerStatus(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== 'hotel_manager') {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        $validated = $request->validate([
            'account_status' => 'required|in:active,suspended,inactive',
        ]);

        $manager->update($validated);

        return response()->json([
            'message' => 'Hotel manager status updated successfully.',
            'data' => [
                'user_id' => $manager->id,
                'hotel_id' => $manager->hotel_id,
                'role' => $manager->role,
                'account_status' => $manager->account_status,
                'updated_at' => $manager->updated_at,
            ],
        ]);
    }

    public function reports(): JsonResponse
    {
        $totalHotels = Hotel::count();

        $activeHotels = Hotel::where('status', 'active')->count();

        $suspendedHotels = Hotel::where('status', 'suspended')->count();

        $totalGuests = User::where('role', 'guest')->count();

        $totalManagers = User::where('role', 'hotel_manager')->count();

        $totalReceptionists = User::where('role', 'receptionist')->count();

        $totalReservations = Reservation::count();

        $totalSuccessfulPayments = Payment::where(
            'status',
            'completed'
        )->count();

        $totalRevenue = Payment::where(
            'status',
            'completed'
        )->sum('amount');

        return response()->json([
            'message' => 'Platform report retrieved successfully.',
            'data' => [
                'total_hotels' => $totalHotels,
                'active_hotels' => $activeHotels,
                'suspended_hotels' => $suspendedHotels,
                'total_guests' => $totalGuests,
                'total_managers' => $totalManagers,
                'total_receptionists' => $totalReceptionists,
                'total_reservations' => $totalReservations,
                'total_successful_payments' => $totalSuccessfulPayments,
                'total_revenue' => number_format($totalRevenue, 2, '.', ''),
            ],
        ]);
    }
}