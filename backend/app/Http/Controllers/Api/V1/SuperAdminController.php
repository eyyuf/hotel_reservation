<?php

namespace App\Http\Controllers\Api\V1;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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
            'email'=>'string|required|email|max:255|unique:hotels,email',
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
            'email' => 'sometimes|email|unique:hotels,email,'. $hotel->id
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
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'phone'      => 'nullable|string|max:20',    // Fixed: removed 'required'
            'password'   => 'required|string|min:8',     // Fixed: added missing validation
        ]);

        $manager = $hotel->staff()->create([
            'first_name'         => $validated['first_name'],
            'last_name'          => $validated['last_name'],
            'email'              => $validated['email'],
            'phone'              => $validated['phone'] ?? null,
            'password'           => $validated['password'], // Fixed: no Hash::make (User model $casts handles it)
            'role'               => 'hotel_manager',
            'status'             => 'active',
            'created_by_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Manager created successfully.',
            'data'    => $manager,
        ], 201);
    }

    public function showManager(Hotel $hotel, User $manager): JsonResponse
    {
        if ($manager->hotel_id !== $hotel->id || $manager->role !== 'hotel_manager') {
           abort(404, 'Manager not found for this hotel.');
        }
        return response()->json([
            'message' => 'manager showed succesfully',
            'data' => $manager
        ]);
    }

    public function updateManager(Request $request, Hotel $hotel, User $manager): JsonResponse
    {
        if ($manager->hotel_id !== $hotel->id || $manager->role !== 'hotel_manager') {
           abort(404, 'Manager not found for this hotel.');
        }
        $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name'  => 'sometimes|string|max:255',
                'email'      => 'sometimes|email|unique:users,email,' . $manager->id,
                'phone'      => 'sometimes|nullable|string|max:20',
            ]);
        $manager ->update($validated);
        
        return response()->json([
            'message' => 'updated manager succesfully',
            'data'=>$manager,

        ]);
    }

    public function managerStatus(Request $request, Hotel $hotel, User $manager): JsonResponse
    {
        if ($manager->hotel_id !== $hotel->id || $manager->role !== 'hotel_manager') {
           abort(404, 'Manager not found for this hotel.');
        }
        $validated= $request->validate([
            'status'=>'required|in:active,suspended',
        ]);
        $manager->update($validated);

        return response()->json([
            'message' => 'manager status updated succesfully',
            'data'=>$manager,
        ]);
    }

    public function reports(Hotel $hotel): JsonResponse
    {
        $totalRooms = $hotel->rooms()->count();
        $occupiedRooms = $hotel->rooms()->where('status', 'occupied')->count();
        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 2) : 0;

        
        $totalReservations = $hotel->reservations()->count();
        $totalRevenue = $hotel->payments()->where('status', 'completed')->sum('amount');
        
        $completedReservations = $hotel->reservations()->where('status', 'completed')->count();
        $cancelledReservations = $hotel->reservations()->where('status', 'cancelled')->count();
        $staffByRole = $hotel->staff->groupBy('role')->map->count();
        return response()->json([
            'message' => 'Hotel report generated succesfully.',
            'data' => [
                'hotel_id'   => $hotel->id,
                'hotel_name' => $hotel->name,

                'financials' => [
                    'total_revenue' => (float) $totalRevenue,
                    'currency'      => 'USD',
                ],

                'occupancy' => [
                    'total_rooms'    => $totalRooms,
                    'occupied_rooms' => $occupiedRooms,
                    'occupancy_rate' => $occupancyRate . '%',
                ],

                'reservations' => [
                    'total_reservations' => $totalReservations,
                ],

                'staffing' => [
                    'total_staff' => $hotel->staff->count(),
                    'by_role'     => $staffByRole, // <-- The key-value counts we calculated earlier!
                ],
            ]
        ]);
    }

}
