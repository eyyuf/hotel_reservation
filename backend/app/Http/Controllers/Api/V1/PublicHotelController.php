<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Hotel;
use App\Models\RoomType;
use Illuminate\Http\Request;

class PublicHotelController extends Controller
{
    public function index(): JsonResponse
    {
        $hotels = Hotel::where('status','active')->paginate(10);


        return response()->json([
            'message' => 'Hotels retrived successfuly',
            'data'=>$hotels,
        ], 200);
    }

    public function show(Hotel $hotel): JsonResponse
    {
        if($hotel->status !== 'active'){
            abort(404);
        }; 



        return response()->json([
            'message' => 'Hotel retrived successfuly',
            'data' => $hotel,
        ], 200);
    }

    public function roomTypes(Hotel $hotel): JsonResponse
    {
        if($hotel->status !== 'active'){
            abort(404);
        };
        
        $roomTypes = $hotel->roomTypes()->where('status','active')->paginate(10);




        return response()->json([
            'message' => 'Room Types retrived successfuly.',
            'data'=>$roomTypes,
        ], 200);
    }

    public function roomType(Hotel $hotel ,RoomType $roomType): JsonResponse
    {
        if($hotel->status !== 'active'){
            abort(404);
        };
        if($roomType->hotel_id !== $hotel->id || $roomType->status !== 'active'){
            abort(404);
        };


        return response()->json([
            'message' => 'Room type retrived successfuly.',
            'data'=> $roomType,
        ], 200);
    }

    public function availability(Request $request, Hotel $hotel): JsonResponse
    {
        if ($hotel->status !== 'active') {
        abort(404);
        }

        $validated = $request->validate([
            'check_in' => [
                'required',
                'date',
                'after_or_equal:today',
            ],
            'check_out' => [
                'required',
                'date',
                'after:check_in',
            ],
        ]);

        $checkIn = $validated['check_in'];
        $checkOut = $validated['check_out'];

        $roomTypes = $hotel->roomTypes()
            ->where('status', 'active')
            ->get();

        $availability = $roomTypes->map(function ($roomType) use ($checkIn, $checkOut) {

        $reservedRooms = $roomType->reservations()
            ->whereIn('status', [
                'pending',
                'confirmed',
                'checked_in',
            ])
            ->where('check_in_date', '<', $checkOut)
            ->where('check_out_date', '>', $checkIn)
            ->sum('number_of_rooms');

        $availableRooms = max(
            0,
            $roomType->total_rooms - $reservedRooms
        );

        return [
            'room_type_id' => $roomType->id,
            'name' => $roomType->name,
            'base_price' => $roomType->base_price,
            'capacity' => $roomType->capacity,
            'total_rooms' => $roomType->total_rooms,
            'reserved_rooms' => $reservedRooms,
            'available_rooms' => $availableRooms,
            'is_available' => $availableRooms > 0,
        ];
        });



        return response()->json([
            'message' => 'Availability retrieved successfully.',
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'data' => $availability,
        ], 200);
    }
}