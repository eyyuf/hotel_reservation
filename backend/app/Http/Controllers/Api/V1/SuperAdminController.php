<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperAdminController extends Controller
{
    public function hotels(): JsonResponse
    {
        $hotels = Hotel::paginate(10);

        $data = $hotels->getCollection()->map(function (Hotel $hotel) {
            return [
                'hotel_id' => $hotel->id,
                'name'     => $hotel->name,
                'address'  => $hotel->address,
                'city'     => $hotel->city,
                'country'  => $hotel->country,
                'phone'    => $hotel->phone,
                'email'    => $hotel->email,
                'status'   => $hotel->status,
            ];
        });

        return response()->json([
            'message' => 'Hotels retrieved successfully.',
            'data'    => $data,
        ]);
    }

    public function createHotel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255|unique:hotels,email',
            'phone'   => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'city'    => 'required|string|max:255',
            'country' => 'required|string|max:255',
        ]);

        $hotel = Hotel::create($validated);

        return response()->json([
            'message' => 'Hotel created successfully.',
            'data'    => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'city'       => $hotel->city,
                'country'    => $hotel->country,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'status'     => $hotel->status,
                'created_at' => $hotel->created_at,
                'updated_at' => $hotel->updated_at,
            ],
        ], 201);
    }

    public function hotel(Hotel $hotel): JsonResponse
    {
        return response()->json([
            'message' => 'Hotel retrieved successfully.',
            'data'    => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'city'       => $hotel->city,
                'country'    => $hotel->country,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'status'     => $hotel->status,
                'created_at' => $hotel->created_at,
                'updated_at' => $hotel->updated_at,
            ],
        ]);
    }

    public function updateHotel(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'city'    => 'sometimes|string|max:255',
            'country' => 'sometimes|string|max:255',
            'phone'   => 'sometimes|string|max:20',
            'email'   => 'sometimes|email|max:255|unique:hotels,email,' . $hotel->id,
        ]);

        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel updated successfully.',
            'data'    => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'city'       => $hotel->city,
                'country'    => $hotel->country,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'status'     => $hotel->status,
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
            'data'    => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'status'     => $hotel->status,
                'updated_at' => $hotel->updated_at,
            ],
        ]);
    }

    public function managers(Hotel $hotel): JsonResponse
    {
        $managers = User::where('hotel_id', $hotel->id)
            ->where('role', 'hotel_manager')
            ->get();

        $data = $managers->map(function (User $manager) {
            return [
                'user_id'            => $manager->id,
                'hotel_id'           => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name'         => $manager->first_name,
                'last_name'          => $manager->last_name,
                'email'              => $manager->email,
                'phone'              => $manager->phone,
                'role'               => $manager->role,
                'account_status'     => $manager->status,
            ];
        });

        return response()->json([
            'message' => 'Hotel managers retrieved successfully.',
            'data'    => $data,
        ]);
    }

    public function createManager(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|max:255|unique:users,email',
            'phone'      => 'nullable|string|max:30',
            'password'   => 'required|string|min:8',
        ]);

        
        $manager = new User();
        $manager->hotel_id           = $hotel->id;
        $manager->first_name         = $validated['first_name'];
        $manager->last_name          = $validated['last_name'];
        $manager->email              = $validated['email'];
        $manager->phone              = $validated['phone'] ?? null;
        $manager->password           = Hash::make($validated['password']);
        $manager->role               = 'hotel_manager';
        $manager->status             = 'active';
        $manager->created_by_user_id = $request->user()?->id;
        $manager->save();

        return response()->json([
            'message' => 'Hotel manager created successfully.',
            'data'    => [
                'user_id'            => $manager->id,
                'hotel_id'           => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name'         => $manager->first_name,
                'last_name'          => $manager->last_name,
                'email'              => $manager->email,
                'phone'              => $manager->phone,
                'role'               => $manager->role,
                'account_status'     => $manager->status,
                'created_at'         => $manager->created_at,
                'updated_at'         => $manager->updated_at,
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
            'data'    => [
                'user_id'            => $manager->id,
                'hotel_id'           => $manager->hotel_id,
                'created_by_user_id' => $manager->created_by_user_id,
                'first_name'         => $manager->first_name,
                'last_name'          => $manager->last_name,
                'email'              => $manager->email,
                'phone'              => $manager->phone,
                'role'               => $manager->role,
                'account_status'     => $manager->status,
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
            'last_name'  => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|max:255|unique:users,email,' . $manager->id,
            'phone'      => 'sometimes|nullable|string|max:30',
        ]);

        
        $manager->update($validated);

        return response()->json([
            'message' => 'Hotel manager updated successfully.',
            'data'    => [
                'user_id'        => $manager->id,
                'hotel_id'       => $manager->hotel_id,
                'first_name'     => $manager->first_name,
                'last_name'      => $manager->last_name,
                'email'          => $manager->email,
                'phone'          => $manager->phone,
                'role'           => $manager->role,
                'account_status' => $manager->status,
                'updated_at'     => $manager->updated_at,
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
        $manager->status = $validated['account_status'];
        $manager->save();

        return response()->json([
            'message' => 'Hotel manager status updated successfully.',
            'data'    => [
                'user_id'        => $manager->id,
                'hotel_id'       => $manager->hotel_id,
                'role'           => $manager->role,
                'account_status' => $manager->status,
                'updated_at'     => $manager->updated_at,
            ],
        ]);
    }

    public function reports(): JsonResponse
    {
        $totalHotels = Hotel::count();
        $activeHotels = Hotel::where('status', 'active')->count();
        $suspendedHotels = Hotel::where('status', 'suspended')->count();

        $totalManagers = User::where('role', 'hotel_manager')->count();
        $totalReceptionists = User::where('role', 'receptionist')->count();
        $totalGuests = User::where('role', 'guest')->count();

        $totalReservations = Reservation::count();
        $totalSuccessfulPayments = Payment::where('status', 'successful')->count();
        $totalRevenue = Payment::where('status', 'successful')->sum('amount');

        return response()->json([
            'message' => 'Platform report retrieved successfully.',
            'data'    => [
                'total_hotels'              => $totalHotels,
                'active_hotels'             => $activeHotels,
                'suspended_hotels'          => $suspendedHotels,
                'total_guests'              => $totalGuests,
                'total_managers'            => $totalManagers,
                'total_receptionists'       => $totalReceptionists,
                'total_reservations'        => $totalReservations,
                'total_successful_payments' => $totalSuccessfulPayments,
                'total_revenue'             => number_format((float) $totalRevenue, 2, '.', ''),
            ],
        ]);
    }
}