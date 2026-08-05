# Hotel Reservation

A simple multi-hotel reservation system organized around a Laravel API backend and a reserved frontend workspace. Hotels will be isolated by `hotel_id`, and the design uses room types rather than individual physical rooms.

Current status: skeleton only.

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
php artisan serve
```

Inspect registered routes with:

```bash
php artisan route:list
```

Authentication, database logic, and business logic are intentionally not implemented.
