<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\ChapaPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function guestIndex(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->guest_user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        $invoice = $reservation->invoice()
            ->with('payments')
            ->first();

        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found for this reservation.',
            ], 404);
        }

        return response()->json([
            'message' => 'Payments retrieved successfully.',
            'data' => [
                'reservation_id' => $reservation->id,
                'invoice_id' => $invoice->id,
                'invoice_status' => $invoice->status,
                'total_amount' => number_format((float) $invoice->total_amount, 2, '.', ''),
                'payments' => $invoice->payments->map(fn (Payment $payment) => [
                    'payment_id' => $payment->id,
                    'amount' => number_format((float) $payment->amount, 2, '.', ''),
                    'payment_method' => $payment->payment_method,
                    'payment_channel' => $payment->payment_channel,
                    'status' => $payment->status,
                    'transaction_reference' => $payment->transaction_reference,
                    'paid_at' => $payment->paid_at,
                    'created_at' => $payment->created_at,
                ]),
            ],
        ]);
    }

    public function guestStore(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->guest_user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Reservation not found.',
            ], 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:card,mobile_money,bank_transfer,chapa'],
        ]);

        return DB::transaction(function () use ($reservation, $validated) {
            $invoice = Invoice::where('reservation_id', $reservation->id)
                ->lockForUpdate()
                ->first();

            if (!$invoice) {
                return response()->json([
                    'message' => 'Invoice not found for this reservation.',
                ], 404);
            }

            if ($invoice->status === 'cancelled') {
                return response()->json([
                    'message' => 'Cannot create a payment for a cancelled invoice.',
                ], 422);
            }

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

            if ((float) $validated['amount'] > $remainingAmount) {
                return response()->json([
                    'message' => 'Payment amount exceeds remaining invoice balance.',
                    'remaining_amount' => number_format($remainingAmount, 2, '.', ''),
                ], 422);
            }

            if ($validated['payment_method'] === 'chapa' && abs((float) $validated['amount'] - $remainingAmount) >= 0.01) {
                return response()->json([
                    'message' => 'Chapa payments must cover the full remaining invoice balance.',
                    'remaining_amount' => number_format($remainingAmount, 2, '.', ''),
                ], 422);
            }

            $paymentChannels = [
                'card' => 'online',
                'mobile_money' => 'mobile_app',
                'bank_transfer' => 'bank',
                'chapa' => 'online',
            ];

            $payment = new Payment();

            $payment->invoice_id = $invoice->id;
            $payment->recorded_by_user_id = $reservation->guest_user_id;
            $payment->amount = $validated['amount'];
            $payment->payment_method = $validated['payment_method'];
            $payment->payment_channel = $paymentChannels[$validated['payment_method']];
            $payment->status = 'pending';
            $payment->transaction_reference = $validated['payment_method'] === 'chapa'
                ? null
                : 'PAY-' . Str::uuid();

            $payment->save();

            return response()->json([
                'message' => 'Payment initiated successfully.',
                'data' => [
                    'payment_id' => $payment->id,
                    'invoice_id' => $payment->invoice_id,
                    'reservation_id' => $reservation->id,
                    'amount' => number_format((float) $payment->amount, 2, '.', ''),
                    'payment_method' => $payment->payment_method,
                    'payment_channel' => $payment->payment_channel,
                    'status' => $payment->status,
                    'transaction_reference' => $payment->transaction_reference,
                ],
            ], 201);
        });
    }

    public function guestShow(Request $request, Payment $payment): JsonResponse
    {
        $payment->load('invoice.reservation');

        if (
            !$payment->invoice ||
            !$payment->invoice->reservation ||
            $payment->invoice->reservation->guest_user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Payment retrieved successfully.',
            'data' => [
                'payment_id' => $payment->id,
                'invoice_id' => $payment->invoice_id,
                'reservation_id' => $payment->invoice->reservation->id,
                'amount' => number_format((float) $payment->amount, 2, '.', ''),
                'payment_method' => $payment->payment_method,
                'payment_channel' => $payment->payment_channel,
                'status' => $payment->status,
                'transaction_reference' => $payment->transaction_reference,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
            ],
        ]);
    }

    public function simulate(Request $request, Payment $payment): JsonResponse
    {
        return DB::transaction(function () use ($request, $payment) {
            $payment = Payment::with('invoice.reservation')
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->first();

            if (
                !$payment ||
                !$payment->invoice ||
                !$payment->invoice->reservation ||
                $payment->invoice->reservation->guest_user_id !== $request->user()->id
            ) {
                return response()->json([
                    'message' => 'Payment not found.',
                ], 404);
            }

            $invoice = Invoice::whereKey($payment->invoice_id)
                ->lockForUpdate()
                ->first();

            if ($invoice->status === 'cancelled') {
                return response()->json([
                    'message' => 'Cannot complete payment for a cancelled invoice.',
                ], 422);
            }

            if ($payment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending payments can be simulated.',
                ], 422);
            }

            $alreadyPaid = Payment::where('invoice_id', $invoice->id)
                ->where('status', 'successful')
                ->sum('amount');

            $remainingAmount = round(
                (float) $invoice->total_amount - (float) $alreadyPaid,
                2
            );

            if ((float) $payment->amount > $remainingAmount) {
                return response()->json([
                    'message' => 'Payment amount exceeds remaining invoice balance.',
                ], 422);
            }

            $payment->status = 'successful';
            $payment->paid_at = now();
            $payment->save();

            $totalPaid = Payment::where('invoice_id', $invoice->id)
                ->where('status', 'successful')
                ->sum('amount');

            $invoice->status = (float) $totalPaid >= (float) $invoice->total_amount
                ? 'paid'
                : 'partially_paid';

            $invoice->save();
            $reservation = $invoice->reservation;

            if ($invoice->status === 'paid' && $reservation->status === 'pending') {
                $reservation->status = 'confirmed';
                $reservation->save();
            }

            return response()->json([
                'message' => 'Payment simulated successfully.',
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at,
                    'invoice_status' => $invoice->status,
                    'remaining_amount' => number_format(
                        max(0, (float) $invoice->total_amount - (float) $totalPaid),
                        2,
                        '.',
                        ''
                    ),
                ],
            ]);
        });
    }

    public function initializeChapa(Request $request, Payment $payment, ChapaPaymentService $chapaService): JsonResponse
    {
        $payment->load(['invoice.reservation.guest', 'invoice.reservation.hotel', 'invoice.reservation.roomType']);

        if (
            !$payment->invoice ||
            !$payment->invoice->reservation ||
            $payment->invoice->reservation->guest_user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending payments can be initialized with Chapa.',
            ], 422);
        }

        if ($payment->invoice->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot initialize payment for a cancelled invoice.',
            ], 422);
        }

        if ($payment->invoice->status === 'paid') {
            return response()->json([
                'message' => 'Invoice is already fully paid.',
            ], 422);
        }

        try {
            $result = $chapaService->initializePayment(
                $payment,
                $request->user(),
                $payment->invoice->reservation
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 502);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to initialize Chapa payment.',
            ], 500);
        }

        return response()->json([
            'message' => 'Chapa payment checkout initialized successfully.',
            'data' => [
                'payment_id' => $payment->id,
                'transaction_reference' => $result['transaction_reference'],
                'checkout_url' => $result['checkout_url'],
            ],
        ]);
    }

    public function verifyChapa(Request $request, string $txRef, ChapaPaymentService $chapaService): JsonResponse
    {
        $payment = Payment::with([
            'invoice.reservation.hotel',
            'invoice.reservation.roomType',
            'invoice.reservation.guest'
        ])
            ->where('transaction_reference', $txRef)
            ->first();

        if (!$payment) {
            return response()->json([
                'message' => 'Payment not found for this transaction reference.',
            ], 404);
        }

        $invoice = $payment->invoice;
        $reservation = $invoice?->reservation;

        // Idempotent: If already successful, return success details immediately
        if ($payment->status === 'successful') {
            return response()->json([
                'message' => 'Payment already verified successfully.',
                'data' => [
                    'payment_id' => $payment->id,
                    'amount' => number_format((float) $payment->amount, 2, '.', ''),
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at,
                    'transaction_reference' => $payment->transaction_reference,
                    'invoice_id' => $invoice?->id,
                    'invoice_status' => $invoice?->status,
                    'reservation' => $reservation ? [
                        'reservation_id' => $reservation->id,
                        'booking_reference' => $reservation->booking_reference,
                        'status' => $reservation->status,
                        'check_in' => $reservation->check_in_date,
                        'check_out' => $reservation->check_out_date,
                        'adults' => $reservation->adults,
                        'children' => $reservation->children,
                        'total_amount' => $reservation->total_amount,
                    ] : null,
                    'hotel' => $reservation?->hotel ? [
                        'id' => $reservation->hotel->id,
                        'name' => $reservation->hotel->name,
                    ] : null,
                    'room_type' => $reservation?->roomType ? [
                        'id' => $reservation->roomType->id,
                        'name' => $reservation->roomType->name,
                    ] : null,
                ],
            ]);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Payment is not in pending state.',
                'status' => $payment->status,
            ], 422);
        }

        try {
            $verification = $chapaService->verifyTransaction($txRef);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 502);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to verify payment with Chapa.',
            ], 500);
        }

        $innerData = $verification['data'] ?? [];
        $apiStatus = strtolower((string) ($verification['status'] ?? ''));
        $gatewayStatus = strtolower((string) ($innerData['status'] ?? ''));

        $isSuccessful =
            $apiStatus === 'success' &&
            $gatewayStatus === 'success';

        $isExplicitlyFailed =
            in_array($gatewayStatus, ['failed', 'cancelled'], true) ||
            $apiStatus === 'failed';

        if ($isExplicitlyFailed) {
            $payment->status = 'failed';
            $payment->save();

            return response()->json([
                'message' => 'Payment verification failed: ' .
                    ($verification['message'] ?? 'Transaction was not successful.'),
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => 'failed',
                    'transaction_reference' => $txRef,
                ],
            ], 422);
        }

        if (!$isSuccessful) {
            return response()->json([
                'message' => 'Payment is still pending verification.',
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => 'pending',
                    'transaction_reference' => $txRef,
                ],
            ], 202);
        }

        try {
            $chapaService->processSuccessfulPayment($payment, $verification);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Payment verification rejected: ' . $e->getMessage(),
            ], 422);
        }

        $payment->refresh();
        $invoice = $payment->invoice;
        $reservation = $invoice?->reservation;

        return response()->json([
            'message' => 'Payment verified successfully.',
            'data' => [
                'payment_id' => $payment->id,
                'amount' => number_format((float) $payment->amount, 2, '.', ''),
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
                'transaction_reference' => $payment->transaction_reference,
                'invoice_id' => $invoice?->id,
                'invoice_status' => $invoice?->status,
                'reservation' => $reservation ? [
                    'reservation_id' => $reservation->id,
                    'booking_reference' => $reservation->booking_reference,
                    'status' => $reservation->status,
                    'check_in' => $reservation->check_in_date,
                    'check_out' => $reservation->check_out_date,
                    'adults' => $reservation->adults,
                    'children' => $reservation->children,
                    'total_amount' => $reservation->total_amount,
                ] : null,
                'hotel' => $reservation?->hotel ? [
                    'id' => $reservation->hotel->id,
                    'name' => $reservation->hotel->name,
                ] : null,
                'room_type' => $reservation?->roomType ? [
                    'id' => $reservation->roomType->id,
                    'name' => $reservation->roomType->name,
                ] : null,
            ],
        ]);
    }
}
