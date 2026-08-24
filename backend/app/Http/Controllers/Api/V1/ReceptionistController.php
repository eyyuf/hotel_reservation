<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\RoomType;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Models\Payment;
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
                ->where('hotel_id', $user->hotel_id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$roomType) {
                return response()->json([
                    'message' => 'Selected room type is not available.',
                ], 422);
            }

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
            $totalAmount = round($nightlyRate * $numberOfRooms * $nights, 2);

            $reservation = new Reservation();

            $reservation->booking_reference = 'BR-' . Str::uuid();
            $reservation->hotel_id = $user->hotel_id;
            $reservation->guest_user_id = $validated['guest_user_id'] ?? null;
            $reservation->room_type_id = $validated['room_type_id'];
            $reservation->created_by_user_id = $user->id;
            $reservation->check_in_date = $validated['check_in_date'];
            $reservation->check_out_date = $validated['check_out_date'];
            $reservation->number_of_rooms = $numberOfRooms;
            $reservation->adults = $adults;
            $reservation->children = $children;
            $reservation->nightly_rate = $nightlyRate;
            $reservation->total_amount = $totalAmount;
            $reservation->special_requests = $validated['special_requests'] ?? null;
            $reservation->status = 'pending';

            $reservation->save();


            $invoice = new Invoice();

            $invoice->reservation_id = $reservation->id;
            $invoice->invoice_number = 'INV-' . $reservation->id . '-' . strtoupper(Str::random(6));
            $invoice->subtotal = $reservation->total_amount;
            $invoice->tax_amount = 0;
            $invoice->discount_amount = 0;
            $invoice->total_amount = $reservation->total_amount;
            $invoice->status = 'unpaid';
            $invoice->issued_at = now();

            $invoice->save();

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
            return response()->json([
                'message' => 'Unauthorized hotel context.'
            ], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        // Validate first
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

        // Use new dates if provided, otherwise existing dates
        $checkInDate = $validated['check_in_date']
            ?? $reservation->check_in_date;

        $checkOutDate = $validated['check_out_date']
            ?? $reservation->check_out_date;

        // Parse dates AFTER validation
        $checkIn = new \DateTime((string) $checkInDate);
        $checkOut = new \DateTime((string) $checkOutDate);

        if ($checkOut <= $checkIn) {
            return response()->json([
                'message' => 'Check-out date must be after check-in date.',
            ], 422);
        }

        return DB::transaction(function () use (
            $reservation,
            $validated,
            $checkInDate,
            $checkOutDate,
            $checkIn,
            $checkOut
        ) {
            $roomTypeId = $validated['room_type_id']
                ?? $reservation->room_type_id;

            $numberOfRooms = $validated['number_of_rooms']
                ?? $reservation->number_of_rooms;

            $adults = $validated['adults']
                ?? $reservation->adults;

            $children = $validated['children']
                ?? $reservation->children;

            $roomType = RoomType::where('id', $roomTypeId)
                ->where('hotel_id', $reservation->hotel_id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$roomType) {
                return response()->json([
                    'message' => 'Selected room type is not available.',
                ], 422);
            }

            // Capacity validation
            $totalGuests = $adults + $children;
            $maxAllowedCapacity = $roomType->capacity * $numberOfRooms;

            if ($totalGuests > $maxAllowedCapacity) {
                return response()->json([
                    'message' => "Selected guest count ($totalGuests) exceeds maximum capacity ($maxAllowedCapacity) for $numberOfRooms room(s).",
                ], 422);
            }

            // Availability check, excluding this reservation
            $reservedRooms = Reservation::where('room_type_id', $roomTypeId)
                ->where('id', '!=', $reservation->id)
                ->whereIn('status', [
                    'pending',
                    'confirmed',
                    'checked_in',
                ])
                ->where('check_in_date', '<', $checkOutDate)
                ->where('check_out_date', '>', $checkInDate)
                ->sum('number_of_rooms');

            $availableRooms = $roomType->total_rooms - $reservedRooms;

            if ($numberOfRooms > $availableRooms) {
                return response()->json([
                    'message' => 'Requested room changes are not available for the selected dates.',
                ], 422);
            }

            // Recalculate pricing
            $nights = $checkIn->diff($checkOut)->days;

            $nightlyRate = $roomType->base_price;

            $totalAmount = round(
                $nightlyRate *
                $numberOfRooms *
                $nights,
                2
            );

            $reservation->check_in_date = $checkInDate;
            $reservation->check_out_date = $checkOutDate;
            $reservation->room_type_id = $roomTypeId;
            $reservation->number_of_rooms = $numberOfRooms;
            $reservation->adults = $adults;
            $reservation->children = $children;
            $reservation->nightly_rate = $nightlyRate;
            $reservation->total_amount = $totalAmount;

            if (array_key_exists('special_requests', $validated)) {
                $reservation->special_requests = $validated['special_requests'];
            }

            $reservation->save();

            // Keep the invoice in sync with the reservation's new total.
            // Only touch it while it's still unpaid — once a payment has
            // landed against it, silently rewriting the amount would make
            // the invoice inconsistent with money already collected.
            $invoice = Invoice::where('reservation_id', $reservation->id)
                ->lockForUpdate()
                ->first();

            if ($invoice && $invoice->status === 'unpaid') {
                $invoice->subtotal = $reservation->total_amount;
                $invoice->total_amount = round(
                    (float) $reservation->total_amount
                        + (float) $invoice->tax_amount
                        - (float) $invoice->discount_amount,
                    2
                );
                $invoice->save();
            }

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

        DB::transaction(function () use ($reservation, $validated) {
            $reservation->status = 'cancelled';
            $reservation->cancellation_reason = $validated['cancellation_reason'] ?? null;
            $reservation->save();

            $invoice = Invoice::where('reservation_id', $reservation->id)
                ->lockForUpdate()
                ->first();

            // Only void the invoice if it hasn't already been fully paid.
            // A paid invoice needs a refund process, not a silent status flip.
            if ($invoice && $invoice->status !== 'paid') {
                $invoice->status = 'cancelled';
                $invoice->save();
            }
        });

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data'    => $reservation,
        ]);
    }

    public function payments(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json([
                'message' => 'Unauthorized hotel context.',
            ], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->with('invoice.payments')
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        if (!$reservation->invoice) {
            return response()->json([
                'message' => 'No invoice found for this reservation.',
                'data' => [],
            ], 200);
        }

        $payments = $reservation->invoice->payments->map(function ($payment) {
            return [
                'payment_id'            => $payment->id,
                'invoice_id'            => $payment->invoice_id,
                'recorded_by_user_id'   => $payment->recorded_by_user_id,
                'amount'                => number_format((float) $payment->amount, 2, '.', ''),
                'payment_method'        => $payment->payment_method,
                'payment_channel'       => $payment->payment_channel,
                'status'                => $payment->status,
                'transaction_reference' => $payment->transaction_reference,
                'paid_at'               => $payment->paid_at,
                'created_at'            => $payment->created_at,
            ];
        });

        return response()->json([
            'message' => 'Payments retrieved successfully.',
            'data' => [
                'reservation_id'    => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'invoice_id'        => $reservation->invoice->id,
                'payments'          => $payments,
            ],
        ]);
    }

        public function recordPayment(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json([
                'message' => 'Unauthorized hotel context.',
            ], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',

            'payment_method' => [
                'required',
                'string',
                'in:cash,bank_transfer,card,mobile_money',
            ],

            'transaction_reference' => [
                'nullable',
                'string',
                'max:255',
                'unique:payments,transaction_reference',
            ],
        ]);

        return DB::transaction(function () use ($user, $validated, $id) {

            // Reservation must belong to receptionist's hotel
            $reservation = Reservation::where('id', $id)
                ->where('hotel_id', $user->hotel_id)
                ->lockForUpdate()
                ->first();

            if (!$reservation) {
                return response()->json([
                    'message' => 'Reservation not found.',
                ], 404);
            }

            // Retrieve AND lock the invoice row
            $invoice = $reservation->invoice()
                ->lockForUpdate()
                ->first();

            if (!$invoice) {
                return response()->json([
                    'message' => 'Invoice not found for this reservation.',
                ], 404);
            }

            if ($invoice->status === 'cancelled') {
                return response()->json([
                    'message' => 'Cannot record payment for a cancelled invoice.',
                ], 422);
            }

            // Calculate how much has already been successfully paid
            $alreadyPaid = Payment::where('invoice_id', $invoice->id)
                ->where('status', 'successful')
                ->sum('amount');

            $remainingAmount = round(
                (float) $invoice->total_amount - (float) $alreadyPaid,
                2
            );

            if ($remainingAmount <= 0) {
                return response()->json([
                    'message' => 'Invoice is already fully paid.',
                ], 422);
            }

            // Prevent overpayment
            if ((float) $validated['amount'] > $remainingAmount) {
                return response()->json([
                    'message' => 'Payment amount exceeds remaining invoice balance.',
                    'remaining_amount' => number_format(
                        $remainingAmount,
                        2,
                        '.',
                        ''
                    ),
                ], 422);
            }

            // Create payment
            $payment = new Payment();

            $payment->invoice_id = $invoice->id;
            $payment->recorded_by_user_id = $user->id;
            $payment->amount = $validated['amount'];
            $payment->payment_method = $validated['payment_method'];
            $payment->payment_channel = 'front_desk';
            $payment->status = 'successful';
            $payment->transaction_reference =
                $validated['transaction_reference'] ?? null;
            $payment->paid_at = now();

            $payment->save();

            // Recalculate total successful payments
            $totalPaid = Payment::where('invoice_id', $invoice->id)
                ->where('status', 'successful')
                ->sum('amount');

            // Update invoice status
            if ((float) $totalPaid >= (float) $invoice->total_amount) {
                $invoice->status = 'paid';
            } elseif ((float) $totalPaid > 0) {
                $invoice->status = 'partially_paid';
            } else {
                $invoice->status = 'unpaid';
            }

            $invoice->save();

            // Once the invoice is fully paid, move the reservation out of
            // 'pending' the same way the guest-side simulate() flow does.
            // Without this, front-desk-paid reservations could never reach
            // 'confirmed' and would be permanently blocked from check-in.
            if ($invoice->status === 'paid' && $reservation->status === 'pending') {
                $reservation->status = 'confirmed';
                $reservation->save();
            }

            $remainingAmountAfterPayment = max(
                0,
                (float) $invoice->total_amount - (float) $totalPaid
            );

            return response()->json([
                'message' => 'Payment recorded successfully.',
                'data' => [
                    'payment_id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'reservation_id' => $reservation->id,
                    'booking_reference' => $reservation->booking_reference,
                    'reservation_status' => $reservation->status,

                    'amount' => number_format(
                        (float) $payment->amount,
                        2,
                        '.',
                        ''
                    ),

                    'payment_method' => $payment->payment_method,
                    'payment_channel' => $payment->payment_channel,
                    'status' => $payment->status,

                    'transaction_reference' =>
                        $payment->transaction_reference,

                    'paid_at' => $payment->paid_at,

                    'invoice_status' => $invoice->status,

                    'remaining_amount' => number_format(
                        $remainingAmountAfterPayment,
                        2,
                        '.',
                        ''
                    ),
                ],
            ], 201);
        });
    }
    public function checkIn(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json([
                'message' => 'Unauthorized hotel context.',
            ], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        // Only confirmed reservations can be checked in
        if ($reservation->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed reservations can be checked in.',
            ], 422);
        }

        $today = now()->startOfDay();

        $checkInDate = Carbon::parse(
            $reservation->check_in_date
        )->startOfDay();

        $checkOutDate = Carbon::parse(
            $reservation->check_out_date
        )->startOfDay();

        // Do not allow check-in before the reservation date
        if ($today->lt($checkInDate)) {
            return response()->json([
                'message' => 'Reservation cannot be checked in before the check-in date.',
            ], 422);
        }

        // Do not allow check-in after the reservation has already ended
        if ($today->gte($checkOutDate)) {
            return response()->json([
                'message' => 'Reservation check-in period has already passed.',
            ], 422);
        }

        $reservation->status = 'checked_in';
        $reservation->save();

        return response()->json([
            'message' => 'Guest checked in successfully.',
            'data' => [
                'reservation_id'    => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'hotel_id'          => $reservation->hotel_id,
                'room_type_id'      => $reservation->room_type_id,
                'check_in_date'     => $reservation->check_in_date,
                'check_out_date'    => $reservation->check_out_date,
                'status'            => $reservation->status,
                'updated_at'        => $reservation->updated_at,
            ],
        ]);
    }

    public function checkOut(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->hotel_id) {
            return response()->json([
                'message' => 'Unauthorized hotel context.',
            ], 403);
        }

        $reservation = Reservation::where('id', $id)
            ->where('hotel_id', $user->hotel_id)
            ->first();

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        // Only checked-in reservations can be checked out
        if ($reservation->status !== 'checked_in') {
            return response()->json([
                'message' => 'Only checked-in reservations can be checked out.',
            ], 422);
        }

        $reservation->status = 'checked_out';
        $reservation->save();

        return response()->json([
            'message' => 'Guest checked out successfully.',
            'data' => [
                'reservation_id'    => $reservation->id,
                'booking_reference' => $reservation->booking_reference,
                'hotel_id'          => $reservation->hotel_id,
                'room_type_id'      => $reservation->room_type_id,
                'check_in_date'     => $reservation->check_in_date,
                'check_out_date'    => $reservation->check_out_date,
                'status'            => $reservation->status,
                'updated_at'        => $reservation->updated_at,
            ],
        ]);
    }
}