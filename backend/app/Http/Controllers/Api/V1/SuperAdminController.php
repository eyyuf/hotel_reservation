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
    $hotels = Hotel::paginate(10);

    return response()->json([
        'message' => 'Hotels retrieved successfully.',
        'data' => $hotels
    ]);
}

    public function createHotel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'=>'string|required|max:255',
            'email'=>'string|email|max:255|unique:hotels,email',
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

    public function updateHotel(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string',
            'country' => 'sometimes|string',
            'phone' => 'sometimes|string',
            'email' => 'sometimes|email',
        ]);

        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel updated successfully.',
            'data' => $hotel
        ]);
    }

    public function hotelStatus(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'status'=>'required|in:active,suspended'
        ]);
        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel status updated successfully.',
            'data'=>$hotel,
        ]);
    }

    public function managers(Hotel $hotel): JsonResponse
    {
        $managers = $hotel->staff()->where('role','hotel_manager')->get();


        return response()->json([
            'message' => 'Hotel managers retrieved successfully.',
            'data' =>$managers
        ]);
    }

    public function createManager(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'name' =>'required|string',
            'email'=>'required|email|unique:users,email',

        ]) ;
        $manager= $hotel->staff()->create($validated);
        

        return response()->json([
            'message' => 'manager created succesfully.',
            'data'=>$manager
        ]);
    }

    public function showManager(Hotel $hotel): JsonResponse
    {
        $manager = $hotel->staff()->where('role', 'hotel_manager')->firstOrFail();
        return response()->json([
            'message' => 'manager showed succesfully',
            'data' => $manager
        ]);
    }

    public function updateManager(Request $request, Hotel $hotel): JsonResponse
    {
        $manager = $hotel->staff()->where('role','hotel_manager')->firstOrFail();
        $validated = $request->validate([
            'name'=>'sometimes|string',
            'email'=>'sometimes|email|unique:user,email,'. $manager->id,
        ]);
        $manager ->update($validated);
        
        return response()->json([
            'message' => 'updated manager succesfully',
            'data'=>$manager,

        ]);
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
