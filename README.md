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
