# Hotel Reservation System

A multi-hotel reservation management system built with a **Laravel API backend** and a separate frontend workspace.

The system supports hotel-specific administration, guest reservations, receptionist operations, invoicing, payment tracking, and room availability management.

Hotels are isolated using `hotel_id`, allowing the application to support multiple independent hotels within a single system. Reservations are based on **room types and available inventory**, rather than individual physical rooms.

## Features

- Multi-hotel architecture with `hotel_id` isolation
- Role-based access control
  - Super Admin
  - Hotel Manager
  - Receptionist
  - Guest
- Hotel management
- Receptionist management
- Room type management
- Room availability checking
- Guest reservations
- Walk-in reservations
- Reservation updates and cancellations
- Check-in and check-out
- Invoice generation and management
- Payment recording and tracking
- Hotel-specific reports
- Concurrency protection to help prevent overbooking

## Tech Stack

### Backend

- Laravel
- PHP
- PostgreSQL
- Laravel Sanctum

### Frontend

The frontend is maintained in a separate workspace and communicates with the Laravel API.

## Project Structure

```text
backend/   Laravel API application
frontend/  Frontend application workspace
docs/      API documentation and project resources
```

## Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

For PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure your PostgreSQL credentials in `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=hotel_reservation
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Then run:

```bash
php artisan migrate
php artisan serve
```

The API will be available through the local Laravel development server.

## API

The backend includes endpoints for:

- Authentication
- Public hotel browsing
- Room type availability
- Guest reservations
- Super admin operations
- Hotel manager operations
- Receptionist operations
- Invoices
- Payments
- Hotel reports

Inspect all registered routes with:

```bash
php artisan route:list
```

## Authentication and Authorization

Authentication is handled using Laravel Sanctum.

Protected endpoints require authentication, and users are restricted according to their assigned roles and permissions.

### Roles

#### Super Admin

- Manages hotels
- Assigns hotel managers
- Has system-wide access

#### Hotel Manager

- Manages their assigned hotel
- Manages receptionists
- Manages room types
- Views hotel reservations
- Views hotel payments and reports

#### Receptionist

- Creates and manages reservations
- Handles walk-in guests
- Records payments
- Performs check-in and check-out operations

#### Guest

- Browses hotels and room types
- Checks availability
- Creates and manages their own reservations
- Accesses their invoices

## Multi-Hotel Isolation

Hotel-related resources are associated with a `hotel_id`.

Authorization ensures that:

- Hotel managers can only access their assigned hotel.
- Receptionists can only access their assigned hotel.
- Guests can only access their own reservations.
- Super admins have system-wide access.

## Reservation Availability and Concurrency

The reservation system uses database transactions and row-level locking to protect room availability during concurrent reservation requests.

When multiple users attempt to reserve the same room type, the system locks the relevant room type before calculating availability and creating the reservation.

The availability calculation considers active reservations with statuses such as:

```text
pending
confirmed
checked_in
```

This helps prevent overbooking when multiple reservation requests are processed simultaneously.

## Invoices and Payments

Reservations can have associated invoices and payments.

The backend includes payment tracking and a local payment simulation flow for development and testing. This allows the payment workflow to be tested without requiring a real payment gateway.

Payment gateway integration can be added later through services such as:

- Telebirr
- Chapa

## Development Status

The backend is implemented and includes:

- Database migrations and models
- Authentication with Sanctum
- Role and hotel-level authorization
- Reservation management
- Availability checking
- Concurrency protection
- Receptionist operations
- Invoice management
- Payment processing and simulation
- Hotel management
- Reporting endpoints

The frontend workspace is reserved for frontend development.

## Future Improvements

- Production payment gateway integration
- Email notifications
- Reservation notifications
- Advanced reporting and analytics
- Automated test expansion
- Audit logging
- Hotel-specific custom domains
- Improved frontend dashboard

## License

This project is intended for educational and development purposes.
