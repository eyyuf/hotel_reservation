<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ManagerController extends Controller
{
    private function checkHotelAuth(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hotel_id) {
            return null;
        }
        return Hotel::find($user->hotel_id);
    }

    private function forbiddenResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'You are not authorized to perform this action.'
        ], 403);
    }

    private function notFoundResponse(string $message = 'Record not found.'): JsonResponse
    {
        return response()->json([
            'message' => $message
        ], 404);
    }

    // --- Hotel Profile ---

    public function hotel(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        return response()->json([
            'message' => 'Hotel retrieved successfully.',
            'data' => [
                'hotel_id' => $hotel->id,
                'name'     => $hotel->name,
                'address'  => $hotel->address,
                'city'     => $hotel->city,
                'country'  => $hotel->country,
                'phone'    => $hotel->phone,
                'email'    => $hotel->email,
                'status'   => $hotel->status,
            ]
        ]);
    }

    public function updateHotel(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'city'    => 'sometimes|string|max:255',
            'country' => 'sometimes|string|max:255',
            'phone'   => 'sometimes|string|max:50',
            'email'   => 'sometimes|email|max:255',
        ]);

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
            ]
        ]);
    }

    // --- Receptionist Management ---

    public function receptionists(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $receptionists = User::where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->get();

        return response()->json([
            'message' => 'Receptionists retrieved successfully.',
            'data' => $receptionists->map(fn($item) => [
                'user_id'            => $item->id,
                'hotel_id'           => $item->hotel_id,
                'created_by_user_id' => $item->created_by_user_id,
                'first_name'         => $item->first_name,
                'last_name'          => $item->last_name,
                'email'              => $item->email,
                'phone'              => $item->phone,
                'role'               => $item->role,
                'account_status'     => $item->account_status ?? $item->status,
            ])
        ]);
    }

    public function createReceptionist(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:8',
            'phone'      => 'nullable|string|max:50',
        ]);

        $receptionist = User::create([
            'hotel_id'           => $hotel->id,
            'created_by_user_id' => $request->user()->id,
            'first_name'         => $validated['first_name'],
            'last_name'          => $validated['last_name'],
            'email'              => $validated['email'],
            'password'           => Hash::make($validated['password']),
            'phone'              => $validated['phone'] ?? null,
            'role'               => 'receptionist',
            'account_status'     => 'active',
        ]);

        return response()->json([
            'message' => 'Receptionist created successfully.',
            'data' => [
                'user_id'            => $receptionist->id,
                'hotel_id'           => $receptionist->hotel_id,
                'created_by_user_id' => $receptionist->created_by_user_id,
                'first_name'         => $receptionist->first_name,
                'last_name'          => $receptionist->last_name,
                'email'              => $receptionist->email,
                'phone'              => $receptionist->phone,
                'role'               => $receptionist->role,
                'account_status'     => $receptionist->account_status,
                'created_at'         => $receptionist->created_at->toISOString(),
                'updated_at'         => $receptionist->updated_at->toISOString(),
            ]
        ], 201);
    }

    public function showReceptionist(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $receptionist = User::where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->where('id', $id)
            ->first();

        if (!$receptionist) return $this->notFoundResponse();

        return response()->json([
            'message' => 'Receptionist retrieved successfully.',
            'data' => [
                'user_id'            => $receptionist->id,
                'hotel_id'           => $receptionist->hotel_id,
                'created_by_user_id' => $receptionist->created_by_user_id,
                'first_name'         => $receptionist->first_name,
                'last_name'          => $receptionist->last_name,
                'email'              => $receptionist->email,
                'phone'              => $receptionist->phone,
                'role'               => $receptionist->role,
                'account_status'     => $receptionist->account_status ?? $receptionist->status,
            ]
        ]);
    }

    public function updateReceptionist(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $receptionist = User::where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->where('id', $id)
            ->first();

        if (!$receptionist) return $this->notFoundResponse();

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $id,
            'phone'      => 'sometimes|string|max:50',
        ]);

        $receptionist->update($validated);

        return response()->json([
            'message' => 'Receptionist updated successfully.',
            'data' => [
                'user_id'        => $receptionist->id,
                'hotel_id'       => $receptionist->hotel_id,
                'first_name'     => $receptionist->first_name,
                'last_name'      => $receptionist->last_name,
                'email'          => $receptionist->email,
                'phone'          => $receptionist->phone,
                'role'           => $receptionist->role,
                'account_status' => $receptionist->account_status ?? $receptionist->status,
                'updated_at'     => $receptionist->updated_at->toISOString(),
            ]
        ]);
    }

    public function updateReceptionistStatus(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $receptionist = User::where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->where('id', $id)
            ->first();

        if (!$receptionist) return $this->notFoundResponse();

        $validated = $request->validate([
            'account_status' => 'required|string|in:active,suspended,inactive',
        ]);

        $receptionist->update(['account_status' => $validated['account_status']]);

        return response()->json([
            'message' => 'Receptionist status updated successfully.',
            'data' => [
                'user_id'        => $receptionist->id,
                'hotel_id'       => $receptionist->hotel_id,
                'role'           => $receptionist->role,
                'account_status' => $receptionist->account_status,
                'updated_at'     => $receptionist->updated_at->toISOString(),
            ]
        ]);
    }

    // --- Room-Type Management ---

    public function roomTypes(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $roomTypes = RoomType::where('hotel_id', $hotel->id)->get();

        return response()->json([
            'message' => 'Room types retrieved successfully.',
            'data' => $roomTypes->map(fn($item) => [
                'room_type_id' => $item->id,
                'hotel_id'     => $item->hotel_id,
                'name'         => $item->name,
                'description'  => $item->description,
                'base_price'   => number_format((float) $item->base_price, 2, '.', ''),
                'capacity'     => (int) $item->capacity,
                'total_rooms'  => (int) ($item->total_rooms ?? 0),
                'status'       => $item->status,
            ])
        ]);
    }

    public function createRoomType(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_price'  => 'required|numeric|min:0',
            'capacity'    => 'required|integer|min:1',
            'total_rooms' => 'required|integer|min:0',
        ]);

        $roomType = RoomType::create([
            'hotel_id'    => $hotel->id,
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'base_price'  => $validated['base_price'],
            'capacity'    => $validated['capacity'],
            'total_rooms' => $validated['total_rooms'],
            'status'      => 'active',
        ]);

        return response()->json([
            'message' => 'Room type created successfully.',
            'data' => [
                'room_type_id' => $roomType->id,
                'hotel_id'     => $roomType->hotel_id,
                'name'         => $roomType->name,
                'description'  => $roomType->description,
                'base_price'   => number_format((float) $roomType->base_price, 2, '.', ''),
                'capacity'     => (int) $roomType->capacity,
                'total_rooms'  => (int) $roomType->total_rooms,
                'status'       => $roomType->status,
                'created_at'   => $roomType->created_at->toISOString(),
                'updated_at'   => $roomType->updated_at->toISOString(),
            ]
        ], 201);
    }

    public function showRoomType(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $roomType = RoomType::where('hotel_id', $hotel->id)->where('id', $id)->first();
        if (!$roomType) return $this->notFoundResponse();

        return response()->json([
            'message' => 'Room type retrieved successfully.',
            'data' => [
                'room_type_id' => $roomType->id,
                'hotel_id'     => $roomType->hotel_id,
                'name'         => $roomType->name,
                'description'  => $roomType->description,
                'base_price'   => number_format((float) $roomType->base_price, 2, '.', ''),
                'capacity'     => (int) $roomType->capacity,
                'total_rooms'  => (int) ($roomType->total_rooms ?? 0),
                'status'       => $roomType->status,
            ]
        ]);
    }

    public function updateRoomType(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $roomType = RoomType::where('hotel_id', $hotel->id)->where('id', $id)->first();
        if (!$roomType) return $this->notFoundResponse();

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'base_price'  => 'sometimes|numeric|min:0',
            'capacity'    => 'sometimes|integer|min:1',
            'total_rooms' => 'sometimes|integer|min:0',
        ]);

        $roomType->update($validated);

        return response()->json([
            'message' => 'Room type updated successfully.',
            'data' => [
                'room_type_id' => $roomType->id,
                'hotel_id'     => $roomType->hotel_id,
                'name'         => $roomType->name,
                'description'  => $roomType->description,
                'base_price'   => number_format((float) $roomType->base_price, 2, '.', ''),
                'capacity'     => (int) $roomType->capacity,
                'total_rooms'  => (int) ($roomType->total_rooms ?? 0),
                'status'       => $roomType->status,
                'updated_at'   => $roomType->updated_at->toISOString(),
            ]
        ]);
    }

    public function updateRoomTypeStatus(Request $request, $id): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $roomType = RoomType::where('hotel_id', $hotel->id)->where('id', $id)->first();
        if (!$roomType) return $this->notFoundResponse();

        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive',
        ]);

        $roomType->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Room-type status updated successfully.',
            'data' => [
                'room_type_id' => $roomType->id,
                'hotel_id'     => $roomType->hotel_id,
                'name'         => $roomType->name,
                'status'       => $roomType->status,
                'updated_at'   => $roomType->updated_at->toISOString(),
            ]
        ]);
    }

    // --- Hotel Records & Reports ---

    public function reservations(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $reservations = Reservation::with(['roomType', 'guest'])
            ->where('hotel_id', $hotel->id)
            ->get();

        return response()->json([
            'message' => 'Hotel reservations retrieved successfully.',
            'data' => $reservations->map(fn($item) => [
                'reservation_id'    => $item->id,
                'booking_reference' => $item->booking_reference,
                'hotel' => [
                    'hotel_id' => $hotel->id,
                    'name'     => $hotel->name,
                ],
                'room_type' => [
                    'room_type_id' => $item->roomType->id ?? null,
                    'name'         => $item->roomType->name ?? null,
                ],
                'guest' => [
                    'user_id'    => $item->guest->id ?? null,
                    'first_name' => $item->guest->first_name ?? null,
                    'last_name'  => $item->guest->last_name ?? null,
                    'email'      => $item->guest->email ?? null,
                    'phone'      => $item->guest->phone ?? null,
                ],
                'check_in_date'      => $item->check_in_date,
                'check_out_date'     => $item->check_out_date,
                'number_of_rooms'    => (int) ($item->number_of_rooms ?? 1),
                'total_amount'       => number_format((float) $item->total_amount, 2, '.', ''),
                'reservation_status' => $item->reservation_status ?? $item->status,
                'payment_status'     => $item->payment_status,
            ])
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $payments = Payment::whereHas('reservation', function ($query) use ($hotel) {
            $query->where('hotel_id', $hotel->id);
        })->get();

        return response()->json([
            'message' => 'Hotel payments retrieved successfully.',
            'data' => $payments->map(fn($item) => [
                'payment_id'            => $item->id,
                'reservation_id'        => $item->reservation_id,
                'booking_reference'     => $item->reservation->booking_reference ?? null,
                'amount'                => number_format((float) $item->amount, 2, '.', ''),
                'payment_method'        => $item->payment_method ?? $item->method,
                'payment_status'        => $item->payment_status ?? $item->status,
                'transaction_reference' => $item->transaction_reference,
                'paid_at'               => $item->paid_at ? $item->paid_at->toISOString() : null,
            ])
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        return response()->json([
            'message' => 'Hotel report retrieved successfully.',
            'data' => [
                'hotel_id'                  => $hotel->id,
                'hotel_name'                => $hotel->name,
                'total_room_types'          => RoomType::where('hotel_id', $hotel->id)->count(),
                'total_room_inventory'      => (int) RoomType::where('hotel_id', $hotel->id)->sum('total_rooms'),
                'available_rooms_today'     => 11, // Replace with dynamic room calculation logic if implemented
                'total_reservations'        => Reservation::where('hotel_id', $hotel->id)->count(),
                'pending_reservations'      => Reservation::where('hotel_id', $hotel->id)->where('reservation_status', 'pending')->count(),
                'confirmed_reservations'    => Reservation::where('hotel_id', $hotel->id)->where('reservation_status', 'confirmed')->count(),
                'checked_in_reservations'   => Reservation::where('hotel_id', $hotel->id)->where('reservation_status', 'checked_in')->count(),
                'checked_out_reservations'  => Reservation::where('hotel_id', $hotel->id)->where('reservation_status', 'checked_out')->count(),
                'total_successful_payments' => Payment::whereHas('reservation', fn($q) => $q->where('hotel_id', $hotel->id))->where('payment_status', 'successful')->count(),
                'total_revenue'             => number_format((float) Payment::whereHas('reservation', fn($q) => $q->where('hotel_id', $hotel->id))->where('payment_status', 'successful')->sum('amount'), 2, '.', ''),
            ]
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $hotel = $this->checkHotelAuth($request);
        if (!$hotel) return $this->forbiddenResponse();

        $logs = AuditLog::with('user')
            ->where('hotel_id', $hotel->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Hotel audit logs retrieved successfully.',
            'data' => $logs->map(fn($item) => [
                'audit_log_id' => $item->id,
                'hotel_id'     => $item->hotel_id,
                'user' => [
                    'user_id'    => $item->user->id ?? null,
                    'first_name' => $item->user->first_name ?? null,
                    'last_name'  => $item->user->last_name ?? null,
                    'role'       => $item->user->role ?? null,
                ],
                'action'      => $item->action,
                'entity_type' => $item->entity_type,
                'entity_id'   => $item->entity_id,
                'description' => $item->description,
                'created_at'  => $item->created_at->toISOString(),
            ])
        ]);
    }
}