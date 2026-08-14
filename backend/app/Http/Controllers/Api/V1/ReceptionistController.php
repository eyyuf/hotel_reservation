<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'guest') {
            $reservations = Reservation::where('guest_user_id', $user->id)
                ->with(['hotel', 'roomType'])
                ->get();
        } else {
            $reservations = Reservation::where('hotel_id', $user->hotel_id)
                ->with(['guest', 'roomType'])
                ->get();
        }

        return response()->json([
            'message' => 'Reservations retrieved successfully.',
            'data'    => $reservations
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id'         => 'required|exists:hotels,id',
            'room_type_id'     => 'required|exists:room_types,id',
            'check_in_date'    => 'required|date|after_or_equal:today',
            'check_out_date'   => 'required|date|after:check_in_date',
            'number_of_rooms'  => 'sometimes|integer|min:1',
            'special_requests' => 'nullable|string',
            'guest_user_id'    => 'nullable|exists:users,id',
        ]);

        $user = $request->user();
        $guestUserId = $user->role === 'guest' ? $user->id : ($validated['guest_user_id'] ?? $user->id);

        $roomType = RoomType::findOrFail($validated['room_type_id']);
        $numberOfRooms = $validated['number_of_rooms'] ?? 1;

        $checkIn = new \DateTime($validated['check_in_date']);
        $checkOut = new \DateTime($validated['check_out_date']);
        $nights = $checkIn->diff($checkOut)->days ?: 1;

        $nightlyRate = $roomType->base_price;
        $totalAmount = $nightlyRate * $numberOfRooms * $nights;

        $reservation = Reservation::create([
            'booking_reference'  => 'BK-' . strtoupper(Str::random(8)),
            'hotel_id'           => $validated['hotel_id'],
            'guest_user_id'      => $guestUserId,
            'room_type_id'       => $validated['room_type_id'],
            'created_by_user_id' => $user->id,
            'check_in_date'      => $validated['check_in_date'],
            'check_out_date'     => $validated['check_out_date'],
            'number_of_rooms'    => $numberOfRooms,
            'nightly_rate'       => $nightlyRate,
            'total_amount'       => $totalAmount,
            'special_requests'   => $validated['special_requests'] ?? null,
            'status'             => 'pending',
        ]);

        return response()->json([
            'message' => 'Reservation created successfully.',
            'data'    => $reservation
        ], 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $query = Reservation::query()->where('id', $id);

        if ($user->role === 'guest') {
            $query->where('guest_user_id', $user->id);
        } else {
            $query->where('hotel_id', $user->hotel_id);
        }

        $reservation = $query->with(['hotel', 'roomType', 'invoice'])->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        return response()->json([
            'message' => 'Reservation retrieved successfully.',
            'data'    => $reservation
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        $validated = $request->validate([
            'status'           => 'sometimes|string|max:30',
            'room_type_id'     => 'sometimes|exists:room_types,id',
            'check_in_date'    => 'sometimes|date',
            'check_out_date'   => 'sometimes|date|after:check_in_date',
            'number_of_rooms'  => 'sometimes|integer|min:1',
            'special_requests' => 'nullable|string',
        ]);

        $reservation->update($validated);

        return response()->json([
            'message' => 'Reservation updated successfully.',
            'data'    => $reservation
        ]);
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $query = Reservation::where('id', $id);

        if ($user->role === 'guest') {
            $query->where('guest_user_id', $user->id);
        } else {
            $query->where('hotel_id', $user->hotel_id);
        }

        $reservation = $query->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'Reservation is already cancelled.'
            ], 400);
        }

        $validated = $request->validate([
            'cancellation_reason' => 'nullable|string',
        ]);

        $reservation->update([
            'status'              => 'cancelled',
            'cancellation_reason' => $validated['cancellation_reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data'    => $reservation
        ]);
    }
    public function payments(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function recordPayment(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function checkIn(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function checkOut(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
