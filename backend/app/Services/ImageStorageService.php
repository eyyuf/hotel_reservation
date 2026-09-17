<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageStorageService
{
    public function getDisk(): string
    {
        return config('filesystems.image_disk', 'r2');
    }

    public function uploadHotelImage(UploadedFile $file, int $hotelId): array
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString() . '.' . strtolower($extension);
        $directory = "hotels/{$hotelId}/images";
        $storagePath = "{$directory}/{$filename}";

        $disk = $this->getDisk();
        $storedPath = Storage::disk($disk)->putFileAs($directory, $file, $filename, 'public');

        if (!$storedPath) {
            throw new \RuntimeException('Failed to store image in object storage.');
        }

        $imageUrl = $this->resolvePublicUrl($storedPath, $disk);

        return [
            'storage_path' => $storedPath,
            'image_url'    => $imageUrl,
        ];
    }

    public function uploadRoomTypeImage(UploadedFile $file, int $roomTypeId): array
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString() . '.' . strtolower($extension);
        $directory = "room-types/{$roomTypeId}/images";
        $storagePath = "{$directory}/{$filename}";

        $disk = $this->getDisk();
        $storedPath = Storage::disk($disk)->putFileAs($directory, $file, $filename, 'public');

        if (!$storedPath) {
            throw new \RuntimeException('Failed to store image in object storage.');
        }

        $imageUrl = $this->resolvePublicUrl($storedPath, $disk);

        return [
            'storage_path' => $storedPath,
            'image_url'    => $imageUrl,
        ];
    }

    public function deleteImage(?string $storagePath): bool
    {
        if (empty($storagePath)) {
            return false;
        }

        $disk = $this->getDisk();
        $deleted = Storage::disk($disk)->delete($storagePath);

        if (!$deleted && Storage::disk($disk)->exists($storagePath)) {
            throw new \RuntimeException('Failed to delete image from object storage.');
        }

        return true;
    }

    public function resolvePublicUrl(string $storagePath, ?string $disk = null): string
    {
        $disk = $disk ?: $this->getDisk();
        $diskConfig = config("filesystems.disks.{$disk}", []);
        $configuredUrl = $diskConfig['url'] ?? null;

        if (!empty($configuredUrl)) {
            return rtrim($configuredUrl, '/') . '/' . ltrim($storagePath, '/');
        }

        try {
            return Storage::disk($disk)->url($storagePath);
        } catch (\Throwable $e) {
            return '/' . ltrim($storagePath, '/');
        }
    }
}
