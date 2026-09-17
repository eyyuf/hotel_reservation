<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\V1\GuestReservationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Models\Hotel;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\RoomType;
use App\Models\User;
use App\Services\Payments\ChapaPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ChapaPaymentTestRunner
{
    private $app;
    private $passed = 0;
    private $failed = 0;
    private $guestA;
    private $tokenGuestA;
    private $guestB;
    private $tokenGuestB;
    private $hotel;
    private $roomType;
    private $chapaService;

    public function __construct($app)
    {
        $this->app = $app;
        $this->chapaService = new ChapaPaymentService();
    }

    private function assert($condition, $message)
    {
        if ($condition) {
            $this->passed++;
            echo "  [PASS] {$message}\n";
        } else {
            $this->failed++;
            echo "  [FAIL] {$message}\n";
        }
    }

    private function resetHttp()
    {
        Http::swap(new \Illuminate\Http\Client\Factory());
    }

    public function run()
    {
        echo "Setting up Chapa test environment...\n";
        $this->setupFixtures();
        echo "Environment ready. Running Chapa payment tests...\n\n";

        $this->testCreateReservationAndPendingPayment();
        $this->testChapaRejectsPartialAmount();
        $this->testInitializeChapaPayment();
        $this->testUnauthorizedGuestCannotInitializePayment();
        $this->testChapaInitializationFailureHandledSafely();
        $this->testVerifyChapaSuccessfulPayment();
        $this->testAmountMismatchRejected();
        $this->testCurrencyMismatchRejected();
        $this->testMissingTxRefRejected();
        $this->testTxRefMismatchRejected();
        $this->testFailedChapaTransactionMarksPaymentFailed();
        $this->testInnerTransactionFailedMarksPaymentFailed();
        $this->testPendingGatewayTransactionReturns202AndKeepsPending();
        $this->testVerifyChapaServerErrorPreservesPendingStatus();
        $this->testIdempotentVerification();
        $this->testSecretsNotExposed();

        echo "\n==========================================\n";
        echo "CHAPA TEST SUMMARY: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "==========================================\n";

        return $this->failed === 0;
    }

    private function setupFixtures()
    {
        // Hotel
        $this->hotel = Hotel::firstOrCreate(
            ['name' => 'Chapa Test Grand Hotel'],
            [
                'address' => 'Bole Medhanealem',
                'city' => 'Addis Ababa',
                'country' => 'Ethiopia',
                'phone' => '+251911000001',
                'email' => 'chapa-test@hotel.com',
                'status' => 'active',
            ]
        );

        // Room Type
        $this->roomType = RoomType::where('hotel_id', $this->hotel->id)->where('name', 'Chapa Test Deluxe Room')->first();
        if (!$this->roomType) {
            $this->roomType = new RoomType();
            $this->roomType->hotel_id = $this->hotel->id;
            $this->roomType->name = 'Chapa Test Deluxe Room';
            $this->roomType->description = 'A test deluxe suite';
            $this->roomType->base_price = 500.00;
            $this->roomType->capacity = 2;
            $this->roomType->total_rooms = 50;
            $this->roomType->status = 'active';
            $this->roomType->save();
        }

        // Guest A
        $this->guestA = User::firstOrCreate(
            ['email' => 'chapa_guest_a@test.com'],
            [
                'first_name' => 'Abebe',
                'last_name' => 'Kebede',
                'phone' => '+251911223344',
                'password' => Hash::make('password123'),
                'role' => 'guest',
                'status' => 'active',
            ]
        );
        $this->tokenGuestA = $this->guestA->createToken('guest-a-token')->plainTextToken;

        // Guest B
        $this->guestB = User::firstOrCreate(
            ['email' => 'chapa_guest_b@test.com'],
            [
                'first_name' => 'Chala',
                'last_name' => 'Tola',
                'phone' => '+251922334455',
                'password' => Hash::make('password123'),
                'role' => 'guest',
                'status' => 'active',
            ]
        );
        $this->tokenGuestB = $this->guestB->createToken('guest-b-token')->plainTextToken;
    }

    private function createTestReservation($guest): Reservation
    {
        $reservation = new Reservation();
        $reservation->booking_reference = 'BR-' . Str::uuid();
        $reservation->hotel_id = $this->hotel->id;
        $reservation->guest_user_id = $guest->id;
        $reservation->room_type_id = $this->roomType->id;
        $reservation->created_by_user_id = $guest->id;
        $reservation->check_in_date = now()->addDays(5)->toDateString();
        $reservation->check_out_date = now()->addDays(7)->toDateString();
        $reservation->number_of_rooms = 1;
        $reservation->adults = 2;
        $reservation->children = 0;
        $reservation->nightly_rate = 500.00;
        $reservation->total_amount = 1000.00;
        $reservation->status = 'pending';
        $reservation->save();

        $invoice = new Invoice();
        $invoice->reservation_id = $reservation->id;
        $invoice->invoice_number = 'INV-' . $reservation->id . '-' . strtoupper(Str::random(6));
        $invoice->subtotal = 1000.00;
        $invoice->tax_amount = 0;
        $invoice->discount_amount = 0;
        $invoice->total_amount = 1000.00;
        $invoice->status = 'unpaid';
        $invoice->issued_at = now();
        $invoice->save();

        return $reservation;
    }

    private function testCreateReservationAndPendingPayment()
    {
        echo "Test 1: Guest creates reservation and pending payment (Chapa decoupled)\n";

        $reservation = $this->createTestReservation($this->guestA);
        $controller = new PaymentController();

        $request = Request::create(
            "/api/v1/guest/reservations/{$reservation->id}/payments",
            'POST',
            [
                'amount' => 1000.00,
                'payment_method' => 'chapa',
            ]
        );
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->guestStore($request, $reservation);
        $data = json_decode($response->getContent(), true);

        $this->assert($response->getStatusCode() === 201, "POST /reservations/{id}/payments returns 201 Created");
        $this->assert(isset($data['data']['payment_id']), "Payment ID is present in response");
        $this->assert($data['data']['status'] === 'pending', "Payment is saved in 'pending' status");
        $this->assert(!isset($data['data']['checkout_url']), "Chapa checkout is NOT automatically created in guestStore");
        $this->assert(is_null($data['data']['transaction_reference']), "Transaction reference is null until Chapa initialization");
    }

    private function testChapaRejectsPartialAmount()
    {
        echo "Test 2: Chapa payments must cover the full remaining invoice balance\n";

        $reservation = $this->createTestReservation($this->guestA);
        $controller = new PaymentController();

        $request = Request::create(
            "/api/v1/guest/reservations/{$reservation->id}/payments",
            'POST',
            [
                'amount' => 500.00, // partial amount when balance is 1000.00
                'payment_method' => 'chapa',
            ]
        );
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->guestStore($request, $reservation);
        $data = json_decode($response->getContent(), true);

        $this->assert($response->getStatusCode() === 422, "Partial amount for Chapa returns 422 Unprocessable Entity");
        $this->assert(str_contains($data['message'] ?? '', 'full remaining invoice balance'), "Message indicates full balance required");
    }

    private function testInitializeChapaPayment()
    {
        $this->resetHttp();
        echo "Test 3: Guest initializes Chapa checkout explicitly\n";

        $reservation = $this->createTestReservation($this->guestA);
        $invoice = $reservation->invoice;

        $payment = new Payment();
        $payment->invoice_id = $invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = null;
        $payment->save();

        Http::fake([
            'https://api.chapa.co/v1/transaction/initialize' => Http::response([
                'message' => 'Hosted Link',
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.co/checkout/payment/test-checkout-url-1234',
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/guest/payments/{$payment->id}/initialize", 'POST');
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->initializeChapa($request, $payment, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $this->assert($response->getStatusCode() === 200, "POST /guest/payments/{id}/initialize returns 200 OK");
        $this->assert(!empty($data['data']['checkout_url']), "Chapa checkout URL is returned");
        $this->assert($data['data']['checkout_url'] === 'https://checkout.chapa.co/checkout/payment/test-checkout-url-1234', "Checkout URL matches Chapa response");
        $this->assert(str_starts_with($data['data']['transaction_reference'], 'HOTEL-PAY-'), "Unique transaction reference is assigned during Chapa initialization");
    }

    private function testUnauthorizedGuestCannotInitializePayment()
    {
        $this->resetHttp();
        echo "Test 4: Guest B cannot initialize payment belonging to Guest A\n";

        $reservation = $this->createTestReservation($this->guestA);
        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = 'HOTEL-PAY-' . Str::uuid();
        $payment->save();

        $controller = new PaymentController();
        $request = Request::create("/api/v1/guest/payments/{$payment->id}/initialize", 'POST');
        $request->setUserResolver(fn() => $this->guestB);

        $response = $controller->initializeChapa($request, $payment, $this->chapaService);
        $this->assert($response->getStatusCode() === 404, "Unauthorized guest receives 404 Not Found");
    }

    private function testChapaInitializationFailureHandledSafely()
    {
        $this->resetHttp();
        echo "Test 5: Gateway initialization error is handled gracefully without leaking secrets\n";

        $reservation = $this->createTestReservation($this->guestA);
        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = 'HOTEL-PAY-' . Str::uuid();
        $payment->save();

        Http::fake([
            'https://api.chapa.co/v1/transaction/initialize' => Http::response([
                'message' => [
                    'customization.description' => ['The customization.description must not exceed 50 characters.'],
                ],
                'status' => 'failed',
                'data' => null,
            ], 400),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/guest/payments/{$payment->id}/initialize", 'POST');
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->initializeChapa($request, $payment, $this->chapaService);
        $content = $response->getContent();

        $this->assert($response->getStatusCode() === 502, "Returns 502 Bad Gateway when Chapa fails with validation array");
        $this->assert(str_contains($content, 'customization.description must not exceed 50 characters'), "Array validation message is safely flattened into string");
        $this->assert(!str_contains($content, 'CHASECK_'), "Response does not leak Chapa secret key");
    }

    private function testVerifyChapaSuccessfulPayment()
    {
        $this->resetHttp();
        echo "Test 6: Verify payment transitions Payment to successful, Invoice to paid, Reservation to confirmed\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Payment details retrieved',
                'status' => 'success',
                'data' => [
                    'first_name' => 'Abebe',
                    'last_name' => 'Kebede',
                    'email' => 'chapa_guest_a@test.com',
                    'currency' => 'ETB',
                    'amount' => 1000.00,
                    'status' => 'success',
                    'tx_ref' => $txRef,
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();
        $reservation->refresh();

        $this->assert($response->getStatusCode() === 200, "Verification returns 200 OK");
        $this->assert($payment->status === 'successful', "Payment status is updated to 'successful'");
        $this->assert(!empty($payment->paid_at), "Payment paid_at timestamp is populated");
        $this->assert($invoice->status === 'paid', "Invoice status is updated to 'paid'");
        $this->assert($reservation->status === 'confirmed', "Reservation status is updated to 'confirmed'");
    }

    private function testAmountMismatchRejected()
    {
        $this->resetHttp();
        echo "Test 7: Amount mismatch from gateway is rejected\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        // Mismatched amount: 200 instead of 1000
        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Payment details retrieved',
                'status' => 'success',
                'data' => [
                    'currency' => 'ETB',
                    'amount' => 200.00,
                    'status' => 'success',
                    'tx_ref' => $txRef,
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();

        $this->assert($response->getStatusCode() === 422, "Amount mismatch returns 422 Unprocessable Entity");
        $this->assert($payment->status === 'pending', "Payment is NOT marked successful");
        $this->assert($invoice->status === 'unpaid', "Invoice remains 'unpaid'");
    }

    private function testCurrencyMismatchRejected()
    {
        $this->resetHttp();
        echo "Test 8: Currency mismatch (non-ETB) is rejected\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        // USD instead of ETB
        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Payment details retrieved',
                'status' => 'success',
                'data' => [
                    'currency' => 'USD',
                    'amount' => 1000.00,
                    'status' => 'success',
                    'tx_ref' => $txRef,
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);

        $payment->refresh();
        $this->assert($response->getStatusCode() === 422, "Currency mismatch returns 422 Unprocessable Entity");
        $this->assert($payment->status === 'pending', "Payment is NOT marked successful");
    }

    private function testMissingTxRefRejected()
    {
        $this->resetHttp();
        echo "Test 9: Missing transaction reference in Chapa response is rejected\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Payment details retrieved',
                'status' => 'success',
                'data' => [
                    'currency' => 'ETB',
                    'amount' => 1000.00,
                    'status' => 'success',
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $payment->refresh();
        $this->assert($response->getStatusCode() === 422, "Missing tx_ref returns 422 Unprocessable Entity");
        $this->assert(str_contains($data['message'] ?? '', 'missing transaction reference'), "Error message notes missing tx_ref");
        $this->assert($payment->status === 'pending', "Payment status remains 'pending'");
    }

    private function testTxRefMismatchRejected()
    {
        $this->resetHttp();
        echo "Test 10: Mismatched transaction reference in Chapa response is rejected\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Payment details retrieved',
                'status' => 'success',
                'data' => [
                    'currency' => 'ETB',
                    'amount' => 1000.00,
                    'status' => 'success',
                    'tx_ref' => 'HOTEL-PAY-DIFFERENT-REF-1234',
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $payment->refresh();
        $this->assert($response->getStatusCode() === 422, "Mismatched tx_ref returns 422 Unprocessable Entity");
        $this->assert(str_contains($data['message'] ?? '', 'mismatch'), "Error message notes tx_ref mismatch");
        $this->assert($payment->status === 'pending', "Payment status remains 'pending'");
    }

    private function testFailedChapaTransactionMarksPaymentFailed()
    {
        $this->resetHttp();
        echo "Test 11: Failed transaction status from gateway marks payment as failed\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Transaction failed',
                'status' => 'failed',
                'data' => [
                    'status' => 'failed',
                    'tx_ref' => $txRef,
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();

        $this->assert($response->getStatusCode() === 422, "Failed verification returns 422");
        $this->assert($payment->status === 'failed', "Payment status is updated to 'failed'");
        $this->assert($invoice->status === 'unpaid', "Invoice status remains 'unpaid'");
    }

    private function testInnerTransactionFailedMarksPaymentFailed()
    {
        $this->resetHttp();
        echo "Test 12: Top-level success but inner data.status='failed' marks payment as failed\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Transaction details retrieved',
                'status' => 'success',
                'data' => [
                    'status' => 'failed',
                    'tx_ref' => $txRef,
                    'currency' => 'ETB',
                    'amount' => 1000.00,
                ],
            ], 200),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();

        $this->assert($response->getStatusCode() === 422, "Failed inner transaction returns 422");
        $this->assert($payment->status === 'failed', "Payment status is updated to 'failed'");
        $this->assert($invoice->status === 'unpaid', "Invoice status remains 'unpaid'");
    }

    private function testPendingGatewayTransactionReturns202AndKeepsPending()
    {
        $this->resetHttp();
        echo "Test 13: Gateway returning pending transaction status returns 202 and preserves pending status\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        $rawGatewayResponse = [
            'message' => 'Payment is pending',
            'status' => 'pending',
            'data' => [
                'status' => 'pending',
                'tx_ref' => $txRef,
                'currency' => 'ETB',
                'amount' => 1000.00,
            ],
        ];

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response($rawGatewayResponse, 200),
        ]);

        // Service preserves actual JSON response without fabricating status => failed
        $serviceResult = $this->chapaService->verifyTransaction($txRef);
        $this->assert($serviceResult['status'] === 'pending', "Service preserves actual gateway status");
        $this->assert(isset($serviceResult['data']), "Service preserves actual gateway data payload");

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();

        $this->assert($response->getStatusCode() === 202, "Pending transaction returns 202 Accepted");
        $this->assert($payment->status === 'pending', "Payment status remains 'pending'");
        $this->assert($invoice->status === 'unpaid', "Invoice status remains 'unpaid'");
        $this->assert(str_contains($data['message'] ?? '', 'pending verification'), "Message explains pending verification");
    }

    private function testVerifyChapaServerErrorPreservesPendingStatus()
    {
        $this->resetHttp();
        echo "Test 14: Gateway 5xx server error during verify returns 502 and keeps payment pending\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        Http::fake([
            "https://api.chapa.co/v1/transaction/verify/{$txRef}" => Http::response([
                'message' => 'Internal Server Error',
            ], 500),
        ]);

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);

        $payment->refresh();
        $invoice = $payment->invoice->fresh();

        $this->assert($response->getStatusCode() === 502, "Server error returns 502 Bad Gateway");
        $this->assert($payment->status === 'pending', "Payment status remains 'pending' for retry");
        $this->assert($invoice->status === 'unpaid', "Invoice status remains 'unpaid'");
    }

    private function testIdempotentVerification()
    {
        $this->resetHttp();
        echo "Test 15: Calling verification on already successful payment is idempotent\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'successful';
        $payment->paid_at = now()->subMinutes(5);
        $payment->transaction_reference = $txRef;
        $payment->save();

        $reservation->invoice->status = 'paid';
        $reservation->invoice->save();

        $reservation->status = 'confirmed';
        $reservation->save();

        $initialPaidAt = $payment->paid_at->toDateTimeString();

        $controller = new PaymentController();
        $request = Request::create("/api/v1/payments/chapa/verify/{$txRef}", 'GET');
        $response = $controller->verifyChapa($request, $txRef, $this->chapaService);
        $data = json_decode($response->getContent(), true);

        $payment->refresh();

        $this->assert($response->getStatusCode() === 200, "Returns 200 for already successful payment");
        $this->assert($data['message'] === 'Payment already verified successfully.', "Acknowledges already verified");
        $this->assert($payment->paid_at->toDateTimeString() === $initialPaidAt, "paid_at timestamp is not overwritten");
    }

    private function testSecretsNotExposed()
    {
        $this->resetHttp();
        echo "Test 16: Secret keys are never exposed in API responses or logs\n";

        $reservation = $this->createTestReservation($this->guestA);
        $txRef = 'HOTEL-PAY-' . Str::uuid();

        $payment = new Payment();
        $payment->invoice_id = $reservation->invoice->id;
        $payment->recorded_by_user_id = $this->guestA->id;
        $payment->amount = 1000.00;
        $payment->payment_method = 'chapa';
        $payment->payment_channel = 'online';
        $payment->status = 'pending';
        $payment->transaction_reference = $txRef;
        $payment->save();

        $controller = new PaymentController();
        $request = Request::create("/api/v1/guest/payments/{$payment->id}", 'GET');
        $request->setUserResolver(fn() => $this->guestA);

        $response = $controller->guestShow($request, $payment);
        $content = $response->getContent();

        $secretKey = (string) config('services.chapa.secret_key');
        $hasSecret = !empty($secretKey) && str_contains($content, $secretKey);

        $this->assert(!$hasSecret, "Payment response does not contain secret key");
    }
}

$runner = new ChapaPaymentTestRunner($app);
$success = $runner->run();
exit($success ? 0 : 1);
