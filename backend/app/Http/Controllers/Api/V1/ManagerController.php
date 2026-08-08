<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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

    public function receptionists(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function createReceptionist(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function receptionist(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function updateReceptionist(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function receptionistStatus(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
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
