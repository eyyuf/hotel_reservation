<?php

namespace App\Http\Controllers\Api\V1;
use App\Models\Reservation;
use App\Http\Controllers\Controller;
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
                    'check_in'       => $reservation->check_in_date ?? $reservation->check_in,
                    'check_out'      => $reservation->check_out_date ?? $reservation->check_out,
                    'status'         => $reservation->status,
                    'total_amount'   => number_format((float) ($reservation->total_amount ?? $reservation->total_price ?? 0), 2, '.', ''),
                    'created_at'     => $reservation->created_at,
                ];
            });

            return response()->json([
                'message' => 'Guest reservations retrieved successfully.',
                'data'    => $data,
            ]);
        }

    public function store(): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id'       => 'required|exists:hotels,id',
            'room_id'        => 'required|exists:rooms,id',
            'check_in_date'  => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'special_notes'  => 'nullable|string|max:500',
        ]);

        $reservation = Reservation::create([
            'hotel_id'           => $validated['hotel_id'],
            'room_id'            => $validated['room_id'],
            'guest_user_id'      => $request->user()->id,
            'created_by_user_id' => $request->user()->id,
            'check_in_date'      => $validated['check_in_date'],
            'check_out_date'     => $validated['check_out_date'],
            'status'             => 'pending',
            'special_notes'      => $validated['special_notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Reservation created successfully.',
            'data'    => [
                'reservation_id' => $reservation->id,
                'hotel_id'       => $reservation->hotel_id,
                'room_id'        => $reservation->room_id,
                'guest_user_id'  => $reservation->guest_user_id,
                'check_in'       => $reservation->check_in_date,
                'check_out'      => $reservation->check_out_date,
                'status'         => $reservation->status,
                'created_at'     => $reservation->created_at,
                'updated_at'     => $reservation->updated_at,
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
                'check_in'           => $reservation->check_in_date ?? $reservation->check_in,
                'check_out'          => $reservation->check_out_date ?? $reservation->check_out,
                'status'             => $reservation->status,
                'special_notes'      => $reservation->special_notes,
                'created_at'         => $reservation->created_at,
                'updated_at'         => $reservation->updated_at,
            ],
        ]);
    }

    public function cancel(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
