<?php

namespace App\Services\Payments;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class ChapaPaymentService
{
    protected string $secretKey;
    protected string $baseUrl;
    protected string $frontendUrl;

    public function __construct()
    {
        $this->secretKey = (string) config('services.chapa.secret_key', '');
        $this->baseUrl = rtrim((string) config('services.chapa.base_url', 'https://api.chapa.co/v1'), '/');
        $this->frontendUrl = rtrim((string) config('services.chapa.frontend_url', 'http://localhost:5173'), '/');
    }

    /**
     * Generate a unique transaction reference for a payment.
     */
    public function generateTxRef(int|string $paymentId): string
    {
        return 'HOTEL-PAY-' . $paymentId . '-' . Str::lower(Str::random(10));
    }

    /**
     * Initialize a Chapa transaction for an existing pending local payment.
     *
     * @return array{checkout_url: string, transaction_reference: string}
     */
    public function initializePayment(Payment $payment, User $guest, Reservation $reservation): array
    {
        if ($payment->status !== 'pending') {
            throw new RuntimeException('Only pending payments can be initialized with Chapa.');
        }

        if (empty($this->secretKey)) {
            throw new RuntimeException('Chapa secret key is not configured.');
        }

        // Ensure unique transaction reference exists on payment
        $txRef = $payment->transaction_reference;
        if (empty($txRef)) {
            $txRef = $this->generateTxRef($payment->id);
            $payment->transaction_reference = $txRef;
            $payment->save();
        }

        $payload = [
            'amount' => number_format((float) $payment->amount, 2, '.', ''),
            'currency' => 'ETB',
            'email' => $guest->email,
            'first_name' => $guest->first_name ?: 'Guest',
            'last_name' => $guest->last_name ?: 'User',
            'tx_ref' => $txRef,
            'return_url' => $this->frontendUrl . '/payment/verify?tx_ref=' . $txRef,
            'customization' => [
                'title' => config('app.name', 'Hotel Reservation'),
                'description' => 'Payment for Booking #' . $reservation->booking_reference,
            ],
            'meta' => [
                'payment_id' => $payment->id,
                'reservation_id' => $reservation->id,
                'invoice_id' => $payment->invoice_id,
            ],
        ];

        if (!empty($guest->phone)) {
            $payload['phone_number'] = $guest->phone;
        }

        try {
            $response = Http::withToken($this->secretKey)
                ->acceptJson()
                ->timeout(15)
                ->post($this->baseUrl . '/transaction/initialize', $payload);
        } catch (\Throwable $e) {
            Log::error('Chapa initialization connection error', ['message' => $e->getMessage()]);
            throw new RuntimeException('Unable to connect to Chapa payment gateway.');
        }

        if ($response->failed() || $response->json('status') !== 'success') {
            $message = $response->json('message') ?? 'Payment gateway error';
            Log::warning('Chapa initialization rejected', [
                'status' => $response->status(),
                'message' => $message,
                'tx_ref' => $txRef,
            ]);
            throw new RuntimeException('Chapa initialization failed: ' . $message);
        }

        $checkoutUrl = (string) $response->json('data.checkout_url');
        if (empty($checkoutUrl)) {
            throw new RuntimeException('Chapa did not return a valid checkout URL.');
        }

        return [
            'checkout_url' => $checkoutUrl,
            'transaction_reference' => $txRef,
        ];
    }

    /**
     * Verify transaction status with Chapa API.
     */
    public function verifyTransaction(string $txRef): array
    {
        if (empty($this->secretKey)) {
            throw new RuntimeException('Chapa secret key is not configured.');
        }

        try {
            $response = Http::withToken($this->secretKey)
                ->acceptJson()
                ->timeout(15)
                ->get($this->baseUrl . '/transaction/verify/' . $txRef);
        } catch (\Throwable $e) {
            Log::error('Chapa verification connection error', ['message' => $e->getMessage()]);
            throw new RuntimeException('Unable to connect to Chapa payment verification service.');
        }

        if ($response->serverError()) {
            Log::error('Chapa verification service returned server error', [
                'status' => $response->status(),
                'tx_ref' => $txRef,
            ]);
            throw new RuntimeException('Chapa verification service temporarily unavailable.');
        }

        return $response->json() ?? [];
    }

    /**
     * Idempotently process a verified successful Chapa payment.
     */
    public function processSuccessfulPayment(Payment $payment, array $chapaData): bool
    {
        $data = $chapaData['data'] ?? $chapaData;

        $chapaStatus = strtolower((string) ($data['status'] ?? ''));
        if ($chapaStatus !== 'success') {
            throw new InvalidArgumentException('Cannot process payment: Chapa status is not success.');
        }

        $chapaTxRef = (string) ($data['tx_ref'] ?? '');
        if ($chapaTxRef === '') {
            throw new InvalidArgumentException('Chapa response is missing transaction reference.');
        }

        if ($chapaTxRef !== (string) $payment->transaction_reference) {
            throw new InvalidArgumentException('Transaction reference mismatch.');
        }

        $chapaCurrency = strtoupper((string) ($data['currency'] ?? ''));
        if ($chapaCurrency !== 'ETB') {
            throw new InvalidArgumentException('Currency mismatch: expected ETB, received ' . $chapaCurrency);
        }

        $chapaAmount = (float) ($data['amount'] ?? 0);
        $expectedAmount = (float) $payment->amount;
        if (abs($chapaAmount - $expectedAmount) >= 0.01) {
            throw new InvalidArgumentException(
                sprintf('Amount mismatch: expected %.2f, received %.2f', $expectedAmount, $chapaAmount)
            );
        }

        return DB::transaction(function () use ($payment) {
            $lockedPayment = Payment::whereKey($payment->id)->lockForUpdate()->first();
            if (!$lockedPayment) {
                return false;
            }

            if ($lockedPayment->status === 'successful') {
                return true;
            }

            $lockedPayment->status = 'successful';
            $lockedPayment->paid_at = now();
            $lockedPayment->save();

            $invoice = Invoice::whereKey($lockedPayment->invoice_id)->lockForUpdate()->first();
            if ($invoice) {
                $totalPaid = Payment::where('invoice_id', $invoice->id)
                    ->where('status', 'successful')
                    ->sum('amount');

                if ((float) $totalPaid >= (float) $invoice->total_amount) {
                    $invoice->status = 'paid';
                } elseif ((float) $totalPaid > 0) {
                    $invoice->status = 'partially_paid';
                } else {
                    $invoice->status = 'unpaid';
                }
                $invoice->save();

                $reservation = $invoice->reservation;
                if ($invoice->status === 'paid' && $reservation && $reservation->status === 'pending') {
                    $reservation->status = 'confirmed';
                    $reservation->save();
                }
            }

            return true;
        });
    }
}
