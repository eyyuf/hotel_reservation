<?php

namespace App\Http\Controllers\Api\V1;
use Illuminate\Http\Request;
use App\Models\Hotel;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SuperAdminController extends Controller
{
    public function hotels()
{
    $hotels = Hotel::all();

    return response()->json([
        'message' => 'Hotels retrieved successfully.',
        'data' => $hotels
    ]);
}

    public function createHotel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'=>'string|required|max:255',
            'email'=>'string|required|max:255',
            'phone'=>'string|required',
            'address'=>'string|required',
            'city'=>'string|required',
            'country'=>'string|required',
        ]);
        $hotel=Hotel::create($validated);
        return response()->json([
            'message' => 'Hotel created succesfully',
            'data' =>$hotel
        ], 201);
    }

    public function hotel(Hotel $hotel): JsonResponse
    {
        return response()->json([
            'message' => 'hotel retrieved successfully.',
            'data'=> $hotel
        ]);
    }

    public function updateHotel(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function hotelStatus(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function managers(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function createManager(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function showManager(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function updateManager(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function managerStatus(): JsonResponse
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
