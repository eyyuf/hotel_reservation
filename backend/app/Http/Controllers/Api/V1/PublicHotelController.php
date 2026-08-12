<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Hotel;

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
        ], 501);
    }

    public function roomType(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function availability(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
