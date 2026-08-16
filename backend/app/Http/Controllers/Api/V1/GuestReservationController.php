<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                'hotel_id'       => $reservation->hotel_id,
                'room_id'        => $reservation->room_id,
                'guest_user_id'  => $reservation->guest_user_id,
                'check_in'       => $reservation->check_in_date,
                'check_out'      => $reservation->check_out_date,
                'status'         => $reservation->status,
                'total_amount'   => number_format((float) $reservation->total_amount, 2, '.', ''),
                'created_at'     => $reservation->created_at,
            ];
        });

        return response()->json([
            'message' => 'Guest reservations retrieved successfully.',
            'data'    => $data,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id'       => 'required|exists:hotels,id',
            'room_id'        => 'required|exists:rooms,id',
            'check_in_date'  => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'number_of_rooms'=> 'required|integer|min:1',
            'adults'         => 'required|integer|min:1',
            'children'       => 'nullable|integer|min:0',
            'special_requests' => 'nullable|string|max:500',
        ]);

        $reservation = Reservation::create([
            'check_in_date'   => $validated['check_in_date'],
            'check_out_date'  => $validated['check_out_date'],
            'number_of_rooms' => $validated['number_of_rooms'],
            'adults'          => $validated['adults'],
            'children'        => $validated['children'] ?? 0,
            'special_requests'=> $validated['special_requests'] ?? null,
        ]);

        $reservation->hotel_id = $validated['hotel_id'];
        $reservation->room_id = $validated['room_id'];
        $reservation->guest_user_id = $request->user()->id;
        $reservation->created_by_user_id = $request->user()->id;
        $reservation->status = 'pending';
        $reservation->save();

        return response()->json([
            'message' => 'Reservation created successfully.',
            'data'    => [
                'reservation_id' => $reservation->id,
                'hotel_id'        => $reservation->hotel_id,
                'room_id'         => $reservation->room_id,
                'guest_user_id'   => $reservation->guest_user_id,
                'check_in'        => $reservation->check_in_date,
                'check_out'       => $reservation->check_out_date,
                'status'          => $reservation->status,
                'created_at'      => $reservation->created_at,
                'updated_at'      => $reservation->updated_at,
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
            'data'    => [
                'reservation_id'     => $reservation->id,
                'hotel_id'           => $reservation->hotel_id,
                'room_id'            => $reservation->room_id,
                'guest_user_id'      => $reservation->guest_user_id,
                'created_by_user_id' => $reservation->created_by_user_id,
                'check_in'           => $reservation->check_in_date,
                'check_out'          => $reservation->check_out_date,
                'status'             => $reservation->status,
                'special_requests'   => $reservation->special_requests,
                'created_at'         => $reservation->created_at,
                'updated_at'         => $reservation->updated_at,
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

        if (in_array($reservation->status, ['cancelled', 'completed'])) {
            return response()->json([
                'message' => 'Reservation cannot be cancelled in its current state.',
            ], 422);
        }

        $reservation->status = 'cancelled';
        $reservation->save();

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data'    => [
                'reservation_id' => $reservation->id,
                'status'         => $reservation->status,
                'updated_at'     => $reservation->updated_at,
            ],
        ]);
    }
}