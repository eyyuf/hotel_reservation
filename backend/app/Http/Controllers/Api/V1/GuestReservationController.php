<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

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
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function cancel(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
