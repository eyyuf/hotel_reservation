# API Endpoints

API base URL: `/api/v1`

All endpoints currently return HTTP 501. No business logic has been implemented.

## Team Member 1

| HTTP method | Path | Controller | Method |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `AuthController` | `register` |
| POST | `/api/v1/auth/login` | `AuthController` | `login` |
| POST | `/api/v1/auth/logout` | `AuthController` | `logout` |
| GET | `/api/v1/auth/me` | `AuthController` | `me` |
| PATCH | `/api/v1/auth/profile` | `AuthController` | `profile` |
| GET | `/api/v1/hotels` | `PublicHotelController` | `index` |
| GET | `/api/v1/hotels/{hotel}` | `PublicHotelController` | `show` |
| GET | `/api/v1/hotels/{hotel}/room-types` | `PublicHotelController` | `roomTypes` |
| GET | `/api/v1/hotels/{hotel}/room-types/{roomType}` | `PublicHotelController` | `roomType` |
| GET | `/api/v1/hotels/{hotel}/availability` | `PublicHotelController` | `availability` |

## Team Member 2

| HTTP method | Path | Controller | Method |
|---|---|---|---|
| GET | `/api/v1/super-admin/hotels` | `SuperAdminController` | `hotels` |
| POST | `/api/v1/super-admin/hotels` | `SuperAdminController` | `createHotel` |
| GET | `/api/v1/super-admin/hotels/{hotel}` | `SuperAdminController` | `hotel` |
| PATCH | `/api/v1/super-admin/hotels/{hotel}` | `SuperAdminController` | `updateHotel` |
| PATCH | `/api/v1/super-admin/hotels/{hotel}/status` | `SuperAdminController` | `hotelStatus` |
| GET | `/api/v1/super-admin/hotels/{hotel}/managers` | `SuperAdminController` | `managers` |
| POST | `/api/v1/super-admin/hotels/{hotel}/managers` | `SuperAdminController` | `createManager` |
| GET | `/api/v1/super-admin/managers/{manager}` | `SuperAdminController` | `showManager` |
| PATCH | `/api/v1/super-admin/managers/{manager}` | `SuperAdminController` | `updateManager` |
| PATCH | `/api/v1/super-admin/managers/{manager}/status` | `SuperAdminController` | `managerStatus` |
| GET | `/api/v1/super-admin/reports` | `SuperAdminController` | `reports` |
| GET | `/api/v1/super-admin/audit-logs` | `SuperAdminController` | `auditLogs` |

## Team Member 3

| HTTP method | Path | Controller | Method |
|---|---|---|---|
| GET | `/api/v1/manager/hotel` | `ManagerController` | `hotel` |
| PATCH | `/api/v1/manager/hotel` | `ManagerController` | `updateHotel` |
| GET | `/api/v1/manager/receptionists` | `ManagerController` | `receptionists` |
| POST | `/api/v1/manager/receptionists` | `ManagerController` | `createReceptionist` |
| GET | `/api/v1/manager/receptionists/{receptionist}` | `ManagerController` | `receptionist` |
| PATCH | `/api/v1/manager/receptionists/{receptionist}` | `ManagerController` | `updateReceptionist` |
| PATCH | `/api/v1/manager/receptionists/{receptionist}/status` | `ManagerController` | `receptionistStatus` |
| GET | `/api/v1/manager/room-types` | `ManagerController` | `roomTypes` |
| POST | `/api/v1/manager/room-types` | `ManagerController` | `createRoomType` |
| GET | `/api/v1/manager/room-types/{roomType}` | `ManagerController` | `roomType` |
| PATCH | `/api/v1/manager/room-types/{roomType}` | `ManagerController` | `updateRoomType` |
| PATCH | `/api/v1/manager/room-types/{roomType}/status` | `ManagerController` | `roomTypeStatus` |
| GET | `/api/v1/manager/reservations` | `ManagerController` | `reservations` |
| GET | `/api/v1/manager/payments` | `ManagerController` | `payments` |
| GET | `/api/v1/manager/invoices` | `InvoiceController` | `managerIndex` |
| GET | `/api/v1/manager/invoices/{invoice}` | `InvoiceController` | `managerShow` |
| GET | `/api/v1/manager/reports` | `ManagerController` | `reports` |
| GET | `/api/v1/manager/audit-logs` | `ManagerController` | `auditLogs` |

Team Member 3 owns manager invoice listing and manager invoice details.

## Team Member 4

| HTTP method | Path | Controller | Method |
|---|---|---|---|
| GET | `/api/v1/guest/reservations` | `GuestReservationController` | `index` |
| POST | `/api/v1/guest/reservations` | `GuestReservationController` | `store` |
| GET | `/api/v1/guest/reservations/{reservation}` | `GuestReservationController` | `show` |
| POST | `/api/v1/guest/reservations/{reservation}/cancel` | `GuestReservationController` | `cancel` |
| GET | `/api/v1/guest/reservations/{reservation}/invoice` | `InvoiceController` | `guestShow` |
| GET | `/api/v1/guest/reservations/{reservation}/payments` | `PaymentController` | `guestIndex` |
| POST | `/api/v1/guest/reservations/{reservation}/payments` | `PaymentController` | `guestStore` |
| GET | `/api/v1/guest/payments/{payment}` | `PaymentController` | `guestShow` |
| POST | `/api/v1/payments/{payment}/simulate` | `PaymentController` | `simulate` |
| GET | `/api/v1/receptionist/reservations` | `ReceptionistController` | `index` |
| POST | `/api/v1/receptionist/reservations` | `ReceptionistController` | `store` |
| GET | `/api/v1/receptionist/reservations/{reservation}` | `ReceptionistController` | `show` |
| PATCH | `/api/v1/receptionist/reservations/{reservation}` | `ReceptionistController` | `update` |
| POST | `/api/v1/receptionist/reservations/{reservation}/cancel` | `ReceptionistController` | `cancel` |
| GET | `/api/v1/receptionist/reservations/{reservation}/payments` | `ReceptionistController` | `payments` |
| POST | `/api/v1/receptionist/reservations/{reservation}/payments` | `ReceptionistController` | `recordPayment` |
| GET | `/api/v1/receptionist/reservations/{reservation}/invoice` | `InvoiceController` | `receptionistShow` |
| POST | `/api/v1/receptionist/reservations/{reservation}/check-in` | `ReceptionistController` | `checkIn` |
| POST | `/api/v1/receptionist/reservations/{reservation}/check-out` | `ReceptionistController` | `checkOut` |

Team Member 4 owns guest and receptionist invoice details, future invoice generation during reservation processing, future payment-channel handling, and future invoice/payment status synchronization.

## Billing notes

- A reservation will eventually have one invoice.
- An invoice may eventually have many payments.
- Invoices will eventually be generated automatically.
- Payment channel will be stored as a field on payments.
- No invoice or payment business logic is currently implemented.
- Every endpoint currently returns HTTP 501.

`payment_method` will describe how a payment was made, with planned examples including `cash`, `bank_transfer`, `card`, `mobile_money`, and `simulated`. `payment_channel` will describe where it was handled, with planned examples including `front_desk`, `online`, `bank`, and `mobile_app`.

Planned examples:

- `payment_method = cash`, `payment_channel = front_desk`
- `payment_method = bank_transfer`, `payment_channel = bank`
- `payment_method = card`, `payment_channel = online`

## Future shared database foundation

The future shared database foundation will include `Hotel`, `User`, `RoomType`, `Reservation`, `Invoice`, `Payment`, and `AuditLog`.

Planned relationships:

- Hotel 1 to many Users
- Hotel 1 to many RoomTypes
- Hotel 1 to many Reservations
- Hotel 1 to many AuditLogs
- User 1 to many Reservations
- User 1 to many AuditLogs
- RoomType 1 to many Reservations
- Reservation 1 to 1 Invoice
- Invoice 1 to many Payments

The future payments table will include `invoice_id`, `recorded_by_user_id`, `amount`, `payment_method`, `payment_channel`, `status`, `transaction_reference`, and `paid_at`.

These database structures and relationships are documentation only and have not been implemented.
