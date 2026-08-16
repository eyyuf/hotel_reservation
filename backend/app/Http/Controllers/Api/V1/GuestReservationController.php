<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class GuestReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reservations = Reservation::where('guest_user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        $data = $reservations->getCollection()->map(function (Reservation $reservation) {
            return [
                'reservation_id' => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'hotel_id' => $reservation->hotel_id,
                'room_type_id' => $reservation->room_type_id,
                'guest_user_id' => $reservation->guest_user_id,
                'check_in' => $reservation->check_in_date,
                'check_out' => $reservation->check_out_date,
                'number_of_rooms' => $reservation->number_of_rooms,
                'adults' => $reservation->adults,
                'children' => $reservation->children,
                'nightly_rate' => $reservation->nightly_rate,
                'total_amount' => $reservation->total_amount,
                'status' => $reservation->status,
                'special_requests' => $reservation->special_requests,
                'created_at' => $reservation->created_at,
            ];
        });

        $reservations->setCollection($data);

        return response()->json([
            'message' => 'Guest reservations retrieved successfully.',
            'data' => $reservations->items(),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'last_page' => $reservations->lastPage(),
                'per_page' => $reservations->perPage(),
                'total' => $reservations->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id' => 'required|exists:hotels,id',
            'room_type_id' => 'required|exists:room_types,id',
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'number_of_rooms' => 'required|integer|min:1',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'special_requests' => 'nullable|string|max:500',
        ]);

        $reservation = DB::transaction(function () use ($validated, $request) {

            $roomType = RoomType::where('id', $validated['room_type_id'])
                ->where('hotel_id', $validated['hotel_id'])
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$roomType) {
                abort(422, 'Selected room type is not available for this hotel.');
            }

            $overlappingReservations = Reservation::where(
                    'room_type_id',
                    $roomType->id
                )
                ->whereIn('status', [
                    'pending',
                    'confirmed',
                    'checked_in',
                ])
                ->where('check_in_date', '<', $validated['check_out_date'])
                ->where('check_out_date', '>', $validated['check_in_date']);

            $reservedRooms = $overlappingReservations->sum('number_of_rooms');

            $availableRooms = $roomType->total_rooms - $reservedRooms;

            if ($validated['number_of_rooms'] > $availableRooms) {
                abort(422, 'Not enough rooms available for the selected dates.');
            }

            $checkIn = Carbon::parse($validated['check_in_date']);
            $checkOut = Carbon::parse($validated['check_out_date']);

            $numberOfNights = $checkIn->diffInDays($checkOut);
            $nightlyRate = $roomType->base_price;

            $totalAmount = (float) $nightlyRate
                * $numberOfNights
                * $validated['number_of_rooms'];

            $reservation = new Reservation();

            $reservation->booking_reference = 'BR-' . Str::uuid();
            $reservation->hotel_id = $validated['hotel_id'];
            $reservation->guest_user_id = $request->user()->id;
            $reservation->room_type_id = $validated['room_type_id'];
            $reservation->created_by_user_id = $request->user()->id;
            $reservation->check_in_date = $validated['check_in_date'];
            $reservation->check_out_date = $validated['check_out_date'];
            $reservation->number_of_rooms = $validated['number_of_rooms'];
            $reservation->adults = $validated['adults'];
            $reservation->children = $validated['children'] ?? 0;
            $reservation->nightly_rate = $nightlyRate;
            $reservation->total_amount = round($totalAmount, 2);
            $reservation->status = 'pending';
            $reservation->special_requests = $validated['special_requests'] ?? null;
            $reservation->save();

            return $reservation;
        });

        return response()->json([
            'message' => 'Reservation created successfully.',
            'data' => [
                'reservation_id' => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'hotel_id' => $reservation->hotel_id,
                'room_type_id' => $reservation->room_type_id,
                'guest_user_id' => $reservation->guest_user_id,
                'check_in' => $reservation->check_in_date,
                'check_out' => $reservation->check_out_date,
                'number_of_rooms' => $reservation->number_of_rooms,
                'adults' => $reservation->adults,
                'children' => $reservation->children,
                'nightly_rate' => $reservation->nightly_rate,
                'total_amount' => $reservation->total_amount,
                'status' => $reservation->status,
                'special_requests' => $reservation->special_requests,
                'created_at' => $reservation->created_at,
                'updated_at' => $reservation->updated_at,
            ],
        ], 201);
    }

    public function show(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->guest_user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Reservation details retrieved successfully.',
            'data' => [
                'reservation_id' => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'hotel_id' => $reservation->hotel_id,
                'room_type_id' => $reservation->room_type_id,
                'guest_user_id' => $reservation->guest_user_id,
                'created_by_user_id' => $reservation->created_by_user_id,
                'check_in' => $reservation->check_in_date,
                'check_out' => $reservation->check_out_date,
                'number_of_rooms' => $reservation->number_of_rooms,
                'adults' => $reservation->adults,
                'children' => $reservation->children,
                'nightly_rate' => $reservation->nightly_rate,
                'total_amount' => $reservation->total_amount,
                'status' => $reservation->status,
                'special_requests' => $reservation->special_requests,
                'created_at' => $reservation->created_at,
                'updated_at' => $reservation->updated_at,
            ],
        ]);
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->guest_user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Reservation cannot be cancelled in its current state.',
            ], 422);
        }

        $reservation->status = 'cancelled';
        $reservation->save();

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data' => [
                'reservation_id' => $reservation->id,
                'status' => $reservation->status,
                'updated_at' => $reservation->updated_at,
            ],
        ]);
    }
}