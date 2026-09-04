<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Services\ImageStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotelImageController extends Controller
{
    public function __construct(
        protected ImageStorageService $imageStorageService
    ) {}

    private function getManagerHotel(Request $request): ?Hotel
    {
        $user = $request->user();
        if (!$user || !$user->hotel_id) {
            return null;
        }

        return Hotel::find($user->hotel_id);
    }

    private function formatImage(HotelImage $image): array
    {
        return [
            'id'          => $image->id,
            'hotel_id'    => $image->hotel_id,
            'image_url'   => $image->image_url,
            'alt_text'    => $image->alt_text,
            'is_primary'  => (bool) $image->is_primary,
            'sort_order'  => (int) $image->sort_order,
            'created_at'  => $image->created_at?->toISOString(),
            'updated_at'  => $image->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->getManagerHotel($request);
        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $images = HotelImage::where('hotel_id', $hotel->id)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'message' => 'Hotel images retrieved successfully.',
            'data'    => $images->map(fn($img) => $this->formatImage($img)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $hotel = $this->getManagerHotel($request);
        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $validated = $request->validate([
            'image'       => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'alt_text'    => ['nullable', 'string', 'max:255'],
            'is_primary'  => ['nullable', 'boolean'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
        ]);

        $isPrimary = $request->boolean('is_primary');
        $sortOrder = array_key_exists('sort_order', $validated) && $validated['sort_order'] !== null
            ? (int) $validated['sort_order']
            : ((HotelImage::where('hotel_id', $hotel->id)->max('sort_order') ?? -1) + 1);

        // Upload to object storage first
        $upload = $this->imageStorageService->uploadHotelImage($validated['image'], $hotel->id);

        try {
            $image = DB::transaction(function () use ($hotel, $upload, $validated, $isPrimary, $sortOrder) {
                if ($isPrimary) {
                    HotelImage::where('hotel_id', $hotel->id)
                        ->update(['is_primary' => false]);
                }

                return HotelImage::create([
                    'hotel_id'     => $hotel->id,
                    'image_url'    => $upload['image_url'],
                    'storage_path' => $upload['storage_path'],
                    'alt_text'     => $validated['alt_text'] ?? null,
                    'is_primary'   => $isPrimary,
                    'sort_order'   => $sortOrder,
                ]);
            });
        } catch (\Throwable $e) {
            // Clean up orphaned storage object if database operation fails
            $this->imageStorageService->deleteImage($upload['storage_path']);
            throw $e;
        }

        return response()->json([
            'message' => 'Hotel image uploaded successfully.',
            'data'    => $this->formatImage($image),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $hotel = $this->getManagerHotel($request);
        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $image = HotelImage::find($id);
        if (!$image) {
            return response()->json([
                'message' => 'Hotel image not found.'
            ], 404);
        }

        if ($image->hotel_id !== $hotel->id) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $validated = $request->validate([
            'alt_text'    => ['nullable', 'string', 'max:255'],
            'is_primary'  => ['nullable', 'boolean'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $hotel, $image, $validated) {
            if ($request->has('is_primary')) {
                $isPrimary = $request->boolean('is_primary');
                if ($isPrimary) {
                    HotelImage::where('hotel_id', $hotel->id)
                        ->where('id', '!=', $image->id)
                        ->update(['is_primary' => false]);
                }
                $image->is_primary = $isPrimary;
            }

            if ($request->has('alt_text')) {
                $image->alt_text = $validated['alt_text'];
            }

            if ($request->has('sort_order')) {
                $image->sort_order = $validated['sort_order'];
            }

            $image->save();
        });

        return response()->json([
            'message' => 'Hotel image updated successfully.',
            'data'    => $this->formatImage($image->fresh()),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $hotel = $this->getManagerHotel($request);
        if (!$hotel) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $image = HotelImage::find($id);
        if (!$image) {
            return response()->json([
                'message' => 'Hotel image not found.'
            ], 404);
        }

        if ($image->hotel_id !== $hotel->id) {
            return response()->json([
                'message' => 'You are not authorized to perform this action.'
            ], 403);
        }

        $storagePath = $image->storage_path;

        DB::transaction(function () use ($image, $storagePath) {
            $this->imageStorageService->deleteImage($storagePath);
            $image->delete();
        });

        return response()->json([
            'message' => 'Hotel image deleted successfully.',
        ]);
    }
}
