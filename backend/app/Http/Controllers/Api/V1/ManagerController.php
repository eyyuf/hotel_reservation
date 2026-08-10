<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerController extends Controller
{
    public function hotel(Request $request): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

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
        ],
    ]);
}

    public function updateHotel(Request $request): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    // Validate only allowed fields (hotel_id and status are excluded)
    $validated = $request->validate([
        'name'    => 'sometimes|string|max:255',
        'address' => 'sometimes|string|max:255',
        'city'    => 'sometimes|string|max:255',
        'country' => 'sometimes|string|max:255',
        'phone'   => 'sometimes|string|max:50',
        'email'   => 'sometimes|email|max:255',
    ]);

    // Update hotel attributes
    $hotel->update($validated);

    return response()->json([
        'message' => 'Hotel information updated successfully.',
        'data' => [
            'hotel_id'   => $hotel->id,
            'name'       => $hotel->name,
            'address'    => $hotel->address,
            'city'       => $hotel->city,
            'country'    => $hotel->country,
            'phone'      => $hotel->phone,
            'email'      => $hotel->email,
            'status'     => $hotel->status,
            'updated_at' => $hotel->updated_at->toISOString(),
        ],
    ], 200);
}

  public function receptionists(Request $request): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    // Query users associated with this hotel who have the receptionist role
    $receptionists = User::where('hotel_id', $hotel->id)
        ->where('role', 'receptionist')
        ->get();

    $data = $receptionists->map(function ($receptionist) {
        return [
            'receptionist_id' => $receptionist->id,
            'first_name'      => $receptionist->first_name,
            'last_name'       => $receptionist->last_name,
            'email'           => $receptionist->email,
            'phone'           => $receptionist->phone,
            'status'          => $receptionist->status,
            'created_at'      => $receptionist->created_at->toISOString(),
        ];
    });

    return response()->json([
        'message' => 'Receptionists retrieved successfully.',
        'data'    => $data,
    ], 200);
}

    public function createReceptionist(Request $request): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    $validated = $request->validate([
        'first_name' => 'required|string|max:255',
        'last_name'  => 'required|string|max:255',
        'email'      => 'required|email|unique:users,email|max:255',
        'phone'      => 'required|string|max:50',
        'password'   => 'required|string|min:8',
    ]);

    $receptionist = User::create([
        'first_name' => $validated['first_name'],
        'last_name'  => $validated['last_name'],
        'email'      => $validated['email'],
        'phone'      => $validated['phone'],
        'password'   => bcrypt($validated['password']),
        'hotel_id'   => $hotel->id,
        'role'       => 'receptionist',
        'status'     => 'active',
    ]);

    return response()->json([
        'message' => 'Receptionist created successfully.',
        'data' => [
            'receptionist_id' => $receptionist->id,
            'first_name'      => $receptionist->first_name,
            'last_name'       => $receptionist->last_name,
            'email'           => $receptionist->email,
            'phone'           => $receptionist->phone,
            'status'          => $receptionist->status,
            'created_at'      => $receptionist->created_at->toISOString(),
        ],
    ], 201);
}

   public function showReceptionist(Request $request, int $id): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    // Find user belonging to THIS hotel with the receptionist role
    $receptionist = User::where('id', $id)
        ->where('hotel_id', $hotel->id)
        ->where('role', 'receptionist')
        ->first();

    if (!$receptionist) {
        return response()->json([
            'message' => 'Receptionist not found.',
        ], 404);
    }

    return response()->json([
        'message' => 'Receptionist retrieved successfully.',
        'data' => [
            'receptionist_id' => $receptionist->id,
            'first_name'      => $receptionist->first_name,
            'last_name'       => $receptionist->last_name,
            'email'           => $receptionist->email,
            'phone'           => $receptionist->phone,
            'status'          => $receptionist->status,
            'created_at'      => $receptionist->created_at->toISOString(),
        ],
    ], 200);
}

   public function updateReceptionist(Request $request, int $id): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    $receptionist = User::where('id', $id)
        ->where('hotel_id', $hotel->id)
        ->where('role', 'receptionist')
        ->first();

    if (!$receptionist) {
        return response()->json([
            'message' => 'Receptionist not found.',
        ], 404);
    }

    $validated = $request->validate([
        'first_name' => 'sometimes|required|string|max:255',
        'last_name'  => 'sometimes|required|string|max:255',
        'email'      => 'sometimes|required|email|max:255|unique:users,email,' . $receptionist->id,
        'phone'      => 'sometimes|required|string|max:50',
    ]);

    $receptionist->update($validated);

    return response()->json([
        'message' => 'Receptionist updated successfully.',
        'data' => [
            'receptionist_id' => $receptionist->id,
            'first_name'      => $receptionist->first_name,
            'last_name'       => $receptionist->last_name,
            'email'           => $receptionist->email,
            'phone'           => $receptionist->phone,
            'status'          => $receptionist->status,
            'created_at'      => $receptionist->created_at->toISOString(),
        ],
    ], 200);
}

public function receptionistStatus(Request $request, int $id): JsonResponse
{
    $user = $request->user();
    $hotel = $user->hotel;

    if (!$hotel) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    $receptionist = User::where('id', $id)
        ->where('hotel_id', $hotel->id)
        ->where('role', 'receptionist')
        ->first();

    if (!$receptionist) {
        return response()->json([
            'message' => 'Receptionist not found.',
        ], 404);
    }

    $validated = $request->validate([
        'status' => 'required|string|in:active,inactive',
    ]);

    $receptionist->update([
        'status' => $validated['status'],
    ]);

    return response()->json([
        'message' => 'Receptionist status updated successfully.',
        'data' => [
            'receptionist_id' => $receptionist->id,
            'first_name'      => $receptionist->first_name,
            'last_name'       => $receptionist->last_name,
            'email'           => $receptionist->email,
            'phone'           => $receptionist->phone,
            'status'          => $receptionist->status,
            'created_at'      => $receptionist->created_at->toISOString(),
        ],
    ], 200);
}

    public function roomTypes(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function createRoomType(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function roomType(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function updateRoomType(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function roomTypeStatus(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function reservations(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function payments(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function reports(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function auditLogs(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
