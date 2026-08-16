<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function guestShow(Request $request, $reservationId): JsonResponse
    {
        $user = $request->user();

        $reservation = Reservation::where('id', $reservationId)
            ->where('guest_user_id', $user->id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found or unauthorized.'
            ], 404);
        }

        $invoice = Invoice::where('reservation_id', $reservation->id)->first();

        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found for this reservation.'
            ], 404);
        }

        return response()->json([
            'message' => 'Invoice retrieved successfully.',
            'data'    => $invoice
        ]);
    }

    public function receptionistShow(Request $request, $reservationId): JsonResponse
    {
        $user = $request->user();

        $reservation = Reservation::where('id', $reservationId)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found for your hotel.'
            ], 404);
        }

        $invoice = Invoice::where('reservation_id', $reservation->id)->first();

        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found for this reservation.'
            ], 404);
        }

        return response()->json([
            'message' => 'Invoice retrieved successfully.',
            'data'    => $invoice
        ]);
    }

    public function managerIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->hotel_id) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $invoices = Invoice::whereHas('reservation', function ($query) use ($user) {
            $query->where('hotel_id', $user->hotel_id);
        })->with('reservation')->get();

        return response()->json([
            'message' => 'Invoices retrieved successfully.',
            'data'    => $invoices
        ]);
    }

    public function managerShow(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->hotel_id) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $invoice = Invoice::whereHas('reservation', function ($query) use ($user) {
            $query->where('hotel_id', $user->hotel_id);
        })->where('id', $id)->first();

        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found.'
            ], 404);
        }

        return response()->json([
            'message' => 'Invoice retrieved successfully.',
            'data'    => $invoice
        ]);
    }
}