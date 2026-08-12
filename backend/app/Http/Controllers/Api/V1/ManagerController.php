<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RoomType;
use App\Models\Reservation;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ManagerController extends Controller
{
    public function hotel(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        return response()->json([
            'message' => 'Hotel details retrieved successfully.',
            'data' => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'created_at' => $hotel->created_at->toISOString(),
                'updated_at' => $hotel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function updateHotel(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $validated = $request->validate([
            'name'    => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:500',
            'phone'   => 'sometimes|required|string|max:50',
            'email'   => 'sometimes|required|email|max:255',
        ]);

        $hotel->update($validated);

        return response()->json([
            'message' => 'Hotel updated successfully.',
            'data' => [
                'hotel_id'   => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'created_at' => $hotel->created_at->toISOString(),
                'updated_at' => $hotel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function receptionists(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $receptionists = User::where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->get();

        $data = $receptionists->map(function ($receptionist) {
            return [
                'receptionist_id' => $receptionist->id,
                'name'            => $receptionist->name,
                'email'           => $receptionist->email,
                'phone'           => $receptionist->phone,
                'status'          => $receptionist->status,
                'created_at'      => $receptionist->created_at->toISOString(),
            ];
        });

        return response()->json([
            'message' => 'Receptionists retrieved successfully.',
            'data'    => $data,
        ], 200);
    }

    public function createReceptionist(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone'    => 'nullable|string|max:50',
        ]);

        $receptionist = User::create([
            'hotel_id' => $hotel->id,
            'role'     => 'receptionist',
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
            'phone'    => $validated['phone'] ?? null,
            'status'   => 'active',
        ]);

        return response()->json([
            'message' => 'Receptionist created successfully.',
            'data' => [
                'receptionist_id' => $receptionist->id,
                'name'            => $receptionist->name,
                'email'           => $receptionist->email,
                'phone'           => $receptionist->phone,
                'status'          => $receptionist->status,
                'created_at'      => $receptionist->created_at->toISOString(),
            ],
        ], 201);
    }

    public function receptionist(Request $request, int $receptionist): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $receptionistModel = User::where('id', $receptionist)
            ->where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->first();

        if (!$receptionistModel) {
            return response()->json([
                'message' => 'Receptionist not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Receptionist details retrieved successfully.',
            'data' => [
                'receptionist_id' => $receptionistModel->id,
                'name'            => $receptionistModel->name,
                'email'           => $receptionistModel->email,
                'phone'           => $receptionistModel->phone,
                'status'          => $receptionistModel->status,
                'created_at'      => $receptionistModel->created_at->toISOString(),
                'updated_at'      => $receptionistModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function updateReceptionist(Request $request, int $receptionist): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $receptionistModel = User::where('id', $receptionist)
            ->where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->first();

        if (!$receptionistModel) {
            return response()->json([
                'message' => 'Receptionist not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $receptionistModel->id,
            'phone' => 'sometimes|nullable|string|max:50',
        ]);

        $receptionistModel->update($validated);

        return response()->json([
            'message' => 'Receptionist updated successfully.',
            'data' => [
                'receptionist_id' => $receptionistModel->id,
                'name'            => $receptionistModel->name,
                'email'           => $receptionistModel->email,
                'phone'           => $receptionistModel->phone,
                'status'          => $receptionistModel->status,
                'updated_at'      => $receptionistModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function receptionistStatus(Request $request, int $receptionist): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $receptionistModel = User::where('id', $receptionist)
            ->where('hotel_id', $hotel->id)
            ->where('role', 'receptionist')
            ->first();

        if (!$receptionistModel) {
            return response()->json([
                'message' => 'Receptionist not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive',
        ]);

        $receptionistModel->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Receptionist status updated successfully.',
            'data' => [
                'receptionist_id' => $receptionistModel->id,
                'status'          => $receptionistModel->status,
                'updated_at'      => $receptionistModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function roomTypes(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $roomTypes = RoomType::where('hotel_id', $hotel->id)->get();

        $data = $roomTypes->map(function ($type) {
            return [
                'room_type_id' => $type->id,
                'name'         => $type->name,
                'description'  => $type->description,
                'base_price'   => $type->base_price,
                'capacity'     => $type->capacity,
                'status'       => $type->status,
                'created_at'   => $type->created_at->toISOString(),
            ];
        });

        return response()->json([
            'message' => 'Room types retrieved successfully.',
            'data'    => $data,
        ], 200);
    }

    public function createRoomType(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_price'  => 'required|numeric|min:0',
            'capacity'    => 'required|integer|min:1',
        ]);

        $roomType = RoomType::create([
            'hotel_id'    => $hotel->id,
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'base_price'  => $validated['base_price'],
            'capacity'    => $validated['capacity'],
            'status'      => 'active',
        ]);

        return response()->json([
            'message' => 'Room type created successfully.',
            'data' => [
                'room_type_id' => $roomType->id,
                'name'         => $roomType->name,
                'description'  => $roomType->description,
                'base_price'   => $roomType->base_price,
                'capacity'     => $roomType->capacity,
                'status'       => $roomType->status,
                'created_at'   => $roomType->created_at->toISOString(),
            ],
        ], 201);
    }

    public function roomType(Request $request, int $roomType): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $roomTypeModel = RoomType::where('id', $roomType)
            ->where('hotel_id', $hotel->id)
            ->first();

        if (!$roomTypeModel) {
            return response()->json([
                'message' => 'Room type not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Room type details retrieved successfully.',
            'data' => [
                'room_type_id' => $roomTypeModel->id,
                'name'         => $roomTypeModel->name,
                'description'  => $roomTypeModel->description,
                'base_price'   => $roomTypeModel->base_price,
                'capacity'     => $roomTypeModel->capacity,
                'status'       => $roomTypeModel->status,
                'created_at'   => $roomTypeModel->created_at->toISOString(),
                'updated_at'   => $roomTypeModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function updateRoomType(Request $request, int $roomType): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $roomTypeModel = RoomType::where('id', $roomType)
            ->where('hotel_id', $hotel->id)
            ->first();

        if (!$roomTypeModel) {
            return response()->json([
                'message' => 'Room type not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'base_price'  => 'sometimes|required|numeric|min:0',
            'capacity'    => 'sometimes|required|integer|min:1',
        ]);

        $roomTypeModel->update($validated);

        return response()->json([
            'message' => 'Room type updated successfully.',
            'data' => [
                'room_type_id' => $roomTypeModel->id,
                'name'         => $roomTypeModel->name,
                'description'  => $roomTypeModel->description,
                'base_price'   => $roomTypeModel->base_price,
                'capacity'     => $roomTypeModel->capacity,
                'status'       => $roomTypeModel->status,
                'updated_at'   => $roomTypeModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function roomTypeStatus(Request $request, int $roomType): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $roomTypeModel = RoomType::where('id', $roomType)
            ->where('hotel_id', $hotel->id)
            ->first();

        if (!$roomTypeModel) {
            return response()->json([
                'message' => 'Room type not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive',
        ]);

        $roomTypeModel->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Room type status updated successfully.',
            'data' => [
                'room_type_id' => $roomTypeModel->id,
                'status'       => $roomTypeModel->status,
                'updated_at'   => $roomTypeModel->updated_at->toISOString(),
            ],
        ], 200);
    }

    public function reservations(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $reservations = Reservation::where('hotel_id', $hotel->id)
            ->latest()
            ->get();

        $data = $reservations->map(function ($res) {
            return [
                'reservation_id' => $res->id,
                'guest_name'     => $res->guest_name,
                'check_in'       => $res->check_in,
                'check_out'      => $res->check_out,
                'status'         => $res->status,
                'total_amount'   => $res->total_amount,
                'created_at'     => $res->created_at->toISOString(),
            ];
        });

        return response()->json([
            'message' => 'Reservations retrieved successfully.',
            'data'    => $data,
        ], 200);
    }

    public function payments(Request $request): JsonResponse
    {
        $user = $request->user();
        $hotel = $user->hotel;

        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        }

        $payments = Payment::where('hotel_id', $hotel->id)
            ->latest()
            ->get();

        $data = $payments->map(function ($payment) {
            return [
                'payment_id'     => $payment->id,
                'reservation_id' => $payment->reservation_id,
                'amount'         => $payment->amount,
                'payment_method' => $payment->payment_method,
                'status'         => $payment->status,
                'created_at'     => $payment->created_at->toISOString(),
            ];
        });

        return response()->json([
            'message' => 'Payments retrieved successfully.',
            'data'    => $data,
        ], 200);
    }

}