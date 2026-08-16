<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ReceptionistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json(['message' => 'Unauthorized hotel context.'], 403);
        }

        $reservations = Reservation::where('hotel_id', $user->hotel_id)
            ->with(['guest', 'roomType', 'invoice'])
            ->get();

        return response()->json([
            'message' => 'Reservations retrieved successfully.',
            'data'    => $reservations,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json(['message' => 'Unauthorized hotel context.'], 403);
        }

        $validated = $request->validate([
            'room_type_id' => [
                'required',
                Rule::exists('room_types', 'id')->where(function ($query) use ($user) {
                    return $query->where('hotel_id', $user->hotel_id)
                                 ->where('status', 'active');
                }),
            ],
            'check_in_date'    => 'required|date|after_or_equal:today',
            'check_out_date'   => 'required|date|after:check_in_date',
            'number_of_rooms'  => 'sometimes|integer|min:1',
            'adults'           => 'sometimes|integer|min:1',
            'children'         => 'sometimes|integer|min:0',
            'special_requests' => 'nullable|string',
            'guest_user_id'    => [
                'nullable',
                Rule::exists('users', 'id')->where(function ($query) {
                    return $query->where('role', 'guest');
                }),
            ],
        ]);

        $numberOfRooms = $validated['number_of_rooms'] ?? 1;
        $adults = $validated['adults'] ?? 1;
        $children = $validated['children'] ?? 0;

        return DB::transaction(function () use ($user, $validated, $numberOfRooms, $adults, $children) {
            $roomType = RoomType::where('id', $validated['room_type_id'])
                ->lockForUpdate()
                ->firstOrFail();

            // Capacity validation
            $totalGuests = $adults + $children;
            $maxAllowedCapacity = $roomType->capacity * $numberOfRooms;
            if ($totalGuests > $maxAllowedCapacity) {
                return response()->json([
                    'message' => "Selected guest count ($totalGuests) exceeds maximum capacity ($maxAllowedCapacity) for $numberOfRooms room(s).",
                ], 422);
            }

            // Availability validation
            $reservedRooms = Reservation::where('room_type_id', $roomType->id)
                ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
                ->where('check_in_date', '<', $validated['check_out_date'])
                ->where('check_out_date', '>', $validated['check_in_date'])
                ->sum('number_of_rooms');

            $availableRooms = $roomType->total_rooms - $reservedRooms;

            if ($numberOfRooms > $availableRooms) {
                return response()->json([
                    'message' => 'Requested number of rooms is not available for the selected dates.',
                ], 422);
            }

            // Financial calculations
            $checkIn = new \DateTime($validated['check_in_date']);
            $checkOut = new \DateTime($validated['check_out_date']);
            $nights = $checkIn->diff($checkOut)->days ?: 1;

            $nightlyRate = $roomType->base_price;
            $totalAmount = $nightlyRate * $numberOfRooms * $nights;

            $reservation = Reservation::create([
                'booking_reference'  => (string) Str::uuid(),
                'hotel_id'           => $user->hotel_id,
                'guest_user_id'      => $validated['guest_user_id'] ?? null,
                'room_type_id'       => $validated['room_type_id'],
                'created_by_user_id' => $user->id,
                'check_in_date'      => $validated['check_in_date'],
                'check_out_date'     => $validated['check_out_date'],
                'number_of_rooms'    => $numberOfRooms,
                'adults'             => $adults,
                'children'           => $children,
                'nightly_rate'       => $nightlyRate,
                'total_amount'       => $totalAmount,
                'special_requests'   => $validated['special_requests'] ?? null,
                'status'             => 'pending',
            ]);

            return response()->json([
                'message' => 'Reservation created successfully.',
                'data'    => $reservation,
            ], 201);
        });
    }

    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json(['message' => 'Unauthorized hotel context.'], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->with(['guest', 'roomType', 'invoice'])
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Reservation retrieved successfully.',
            'data'    => $reservation,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json(['message' => 'Unauthorized hotel context.'], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        $checkInDate = $request->input('check_in_date', $reservation->check_in_date);
        $checkOutDate = $request->input('check_out_date', $reservation->check_out_date);

        if ($checkOutDate <= $checkInDate) {
            return response()->json([
                'message' => 'Check-out date must be after check-in date.',
            ], 422);
        }

        $validated = $request->validate([
            'room_type_id' => [
                'sometimes',
                Rule::exists('room_types', 'id')->where(function ($query) use ($user) {
                    return $query->where('hotel_id', $user->hotel_id)
                                 ->where('status', 'active');
                }),
            ],
            'check_in_date'    => 'sometimes|date',
            'check_out_date'   => 'sometimes|date',
            'number_of_rooms'  => 'sometimes|integer|min:1',
            'adults'           => 'sometimes|integer|min:1',
            'children'         => 'sometimes|integer|min:0',
            'special_requests' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($reservation, $validated, $checkInDate, $checkOutDate) {
            $roomTypeId = $validated['room_type_id'] ?? $reservation->room_type_id;
            $numberOfRooms = $validated['number_of_rooms'] ?? $reservation->number_of_rooms;
            $adults = $validated['adults'] ?? $reservation->adults;
            $children = $validated['children'] ?? $reservation->children;

            $roomType = RoomType::where('id', $roomTypeId)
                ->lockForUpdate()
                ->firstOrFail();

            // Capacity validation
            $totalGuests = $adults + $children;
            $maxAllowedCapacity = $roomType->capacity * $numberOfRooms;
            if ($totalGuests > $maxAllowedCapacity) {
                return response()->json([
                    'message' => "Selected guest count ($totalGuests) exceeds maximum capacity ($maxAllowedCapacity) for $numberOfRooms room(s).",
                ], 422);
            }

            // Availability check (excluding current reservation ID)
            $reservedRooms = Reservation::where('room_type_id', $roomTypeId)
                ->where('id', '!=', $reservation->id)
                ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
                ->where('check_in_date', '<', $checkOutDate)
                ->where('check_out_date', '>', $checkInDate)
                ->sum('number_of_rooms');

            $availableRooms = $roomType->total_rooms - $reservedRooms;

            if ($numberOfRooms > $availableRooms) {
                return response()->json([
                    'message' => 'Requested room changes are not available for the selected dates.',
                ], 422);
            }

            // Recalculate nightly rate and total amount
            $checkIn = new \DateTime($checkInDate);
            $checkOut = new \DateTime($checkOutDate);
            $nights = $checkIn->diff($checkOut)->days ?: 1;

            $nightlyRate = $roomType->base_price;
            $totalAmount = $nightlyRate * $numberOfRooms * $nights;

            $reservation->update(array_merge($validated, [
                'check_in_date'   => $checkInDate,
                'check_out_date'  => $checkOutDate,
                'room_type_id'    => $roomTypeId,
                'number_of_rooms' => $numberOfRooms,
                'adults'          => $adults,
                'children'        => $children,
                'nightly_rate'    => $nightlyRate,
                'total_amount'    => $totalAmount,
            ]));

            return response()->json([
                'message' => 'Reservation updated successfully.',
                'data'    => $reservation,
            ]);
        });
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json(['message' => 'Unauthorized hotel context.'], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Reservation cannot be cancelled in its current state.',
            ], 422);
        }

        $validated = $request->validate([
            'cancellation_reason' => 'nullable|string',
        ]);

        $reservation->status = 'cancelled';
        $reservation->cancellation_reason = $validated['cancellation_reason'] ?? null;
        $reservation->save();

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data'    => $reservation,
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