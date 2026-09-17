# Hotel Reservation

A simple multi-hotel reservation system organized around a Laravel API backend and a reserved frontend workspace. Hotels will be isolated by `hotel_id`, and the design uses room types rather than individual physical rooms.

Current status: skeleton only.

The API blueprint currently registers 59 skeleton-only routes, including invoice endpoints. Payment channel support is planned but not implemented, and models and migrations have not yet been created.

## Folder structure

```text
backend/   Laravel API application
frontend/  Reserved for future frontend development
docs/      API endpoint blueprint
```

## Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

In PowerShell, copy the environment file with:

```powershell
Copy-Item .env.example .env
```

Configure the PostgreSQL values in `.env` before running migrations.

Inspect registered routes with:

```bash
php artisan route:list
```

Authentication, database logic, and business logic are intentionally not implemented.

## Chapa Test Mode Payment Integration

The reservation system supports Chapa payment gateway integration in test mode.

### Environment Configuration

In `backend/.env`:

```env
CHAPA_MODE=test
CHAPA_SECRET_KEY=your_chapa_test_secret_key
CHAPA_BASE_URL=https://api.chapa.co/v1
FRONTEND_URL=http://localhost:5173
```

### Payment Lifecycle Flow

1. **Create Pending Payment**: `POST /api/v1/guest/reservations/{reservation}/payments` creates a local `pending` payment record without coupling to Chapa.
2. **Initialize Chapa**: `POST /api/v1/guest/payments/{payment}/initialize` is called when the guest proceeds to pay. Returns Chapa hosted `checkout_url` and `tx_ref`.
3. **Guest Checkout**: Guest is redirected to Chapa test checkout to complete payment.
4. **Return & Verification**: Chapa redirects to frontend return URL `/payment/verify?tx_ref=...`. The frontend calls `GET /api/v1/payments/chapa/verify/{tx_ref}`.
5. **Fulfillment**: Backend verifies status with Chapa API, validates currency (`ETB`) and exact amount match, idempotently marks payment `successful`, updates invoice to `paid`, and marks reservation `confirmed`.

### Running Verification Tests

Run the standalone verification suite:

```bash
cd backend
php tests/verify_chapa_payment.php
```
