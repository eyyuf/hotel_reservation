# Hotel Reservation System

A full-stack hotel reservation management system that allows multiple hotels to manage rooms, reservations, guests, payments, and daily operations from a single platform.

The system supports different user roles, hotel-level access control, room availability management, reservations, invoicing, payments, and check-in/check-out operations.

## Features

* Multi-hotel management
* Role-based access control
* Hotel manager and receptionist management
* Room type and availability management
* Guest reservations
* Walk-in reservations
* Reservation cancellation and updates
* Check-in and check-out
* Invoice management
* Payment tracking
* Hotel reports
* Overbooking protection with database transactions and row-level locking

## User Roles

* **Super Admin**: Manages hotels and system-wide operations
* **Hotel Manager**: Manages their hotel, staff, rooms, reservations, payments, and reports
* **Receptionist**: Handles reservations, walk-ins, payments, check-in, and check-out
* **Guest**: Browses hotels, checks availability, and manages reservations

## Tech Stack

### Backend

* Laravel
* PHP
* PostgreSQL
* Laravel Sanctum

### Frontend

* React

## Project Structure

```text
hotel_reservation/
├── backend/     # Laravel API
├── frontend/    # React frontend
└── docs/        # Documentation
```

## Getting Started

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure your PostgreSQL database in the `.env` file before running the migrations.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Reservation System

Reservations are made using **room types and available inventory** rather than individual physical rooms.

The backend uses database transactions and row-level locking when processing reservations to help prevent overbooking when multiple users try to reserve the same room type at the same time.

## Payments

The system includes invoice and payment management with a local payment simulation for development and testing.

Real payment providers such as **Telebirr** or **Chapa** can be integrated later.

## Project Status

The core backend and frontend are implemented and integrated.

The project is currently intended for educational and development purposes.

## Repository

[GitHub](https://github.com/eyyuf/hotel_reservation)
