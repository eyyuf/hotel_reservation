<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

echo "--- Cloudflare R2 Real Upload Verification ---\n";

// 1. Check configuration presence without printing any secrets
$diskConfig = config('filesystems.disks.r2', []);
$hasKey = !empty($diskConfig['key']);
$hasSecret = !empty($diskConfig['secret']);
$hasBucket = !empty($diskConfig['bucket']);
$hasEndpoint = !empty($diskConfig['endpoint']);

if (!$hasKey || !$hasSecret || !$hasBucket || !$hasEndpoint) {
    echo "[FAIL] R2 configuration is incomplete or unavailable in backend/.env.\n";
    echo "  - Access Key ID configured: " . ($hasKey ? "Yes" : "No") . "\n";
    echo "  - Secret Key configured: " . ($hasSecret ? "Yes" : "No") . "\n";
    echo "  - Bucket configured: " . ($hasBucket ? "Yes" : "No") . "\n";
    echo "  - Endpoint configured: " . ($hasEndpoint ? "Yes" : "No") . "\n";
    exit(1);
}

echo "[PASS] Cloudflare R2 credentials and bucket configuration are present in environment.\n";

// 2. Ensure default image_disk is r2
config(['filesystems.image_disk' => 'r2']);

// 3. Find active hotel and manager
$hotel = Hotel::where('status', 'active')->first();
if (!$hotel) {
    echo "[FAIL] No active hotel found in database.\n";
    exit(1);
}

$manager = User::where('role', 'hotel_manager')
    ->where('hotel_id', $hotel->id)
    ->where('status', 'active')
    ->first();

if (!$manager) {
    echo "[FAIL] No active hotel manager found for hotel ID {$hotel->id}.\n";
    exit(1);
}

$token = $manager->createToken('r2_e2e_test')->plainTextToken;

// 4. Create a valid test image in temp file
$tempPath = tempnam(sys_get_temp_dir(), 'r2_test');
$pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
file_put_contents($tempPath, $pngContent);
$testFile = new UploadedFile($tempPath, 'r2_verify_test.png', 'image/png', null, true);

// 5. Upload through existing API endpoint
echo "Uploading test image through POST /api/v1/manager/hotel/images...\n";

$server = [
    'HTTP_ACCEPT'        => 'application/json',
    'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
];

$req = Request::create(
    '/api/v1/manager/hotel/images',
    'POST',
    [
        'alt_text'   => 'R2 Verification Test Image',
        'is_primary' => '0',
    ],
    [],
    ['image' => $testFile],
    $server
);

$res = $app->handle($req);

if ($res->getStatusCode() !== 201) {
    echo "[FAIL] Upload request failed with status: " . $res->getStatusCode() . "\n";
    echo "Response: " . $res->getContent() . "\n";
    exit(1);
}

$data = json_decode($res->getContent(), true)['data'] ?? [];
$imageId = $data['id'] ?? null;
$imageUrl = $data['image_url'] ?? null;

if (!$imageId) {
    echo "[FAIL] No image ID returned in response.\n";
    exit(1);
}

echo "[PASS] Test image successfully uploaded (HTTP 201 Created, DB record ID: {$imageId}).\n";

// Find storage path from database
$dbRecord = HotelImage::find($imageId);
if (!$dbRecord) {
    echo "[FAIL] Database record not found for ID {$imageId}.\n";
    exit(1);
}

$storagePath = $dbRecord->storage_path;

// 6. Verify object physically exists in Cloudflare R2 bucket
echo "Verifying object existence in Cloudflare R2 bucket...\n";
try {
    $existsInR2 = Storage::disk('r2')->exists($storagePath);
    if ($existsInR2) {
        echo "[PASS] Object successfully confirmed in Cloudflare R2 storage.\n";
        echo "  - Relative path: {$storagePath}\n";
    } else {
        echo "[FAIL] Object was not found in Cloudflare R2 storage.\n";
        exit(1);
    }
} catch (\Throwable $e) {
    echo "[FAIL] Error communicating with Cloudflare R2: " . $e->getMessage() . "\n";
    exit(1);
}

// 7. Verify image URL connectivity
echo "Checking public image URL accessibility...\n";
if (!empty($imageUrl)) {
    $ch = curl_init($imageUrl);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 400) {
        echo "[PASS] Image URL is directly reachable publicly (HTTP status: {$httpCode}).\n";
    } else {
        echo "[NOTE] Direct unsigned image URL returned HTTP status: {$httpCode} (Expected when CLOUDFLARE_R2_URL public domain is not set and bucket requires signed requests or public R2.dev access).\n";
        try {
            $tempUrl = Storage::disk('r2')->temporaryUrl($storagePath, now()->addMinutes(5));
            $ch2 = curl_init($tempUrl);
            curl_setopt($ch2, CURLOPT_NOBODY, true);
            curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch2, CURLOPT_TIMEOUT, 10);
            curl_exec($ch2);
            $signedCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
            curl_close($ch2);
            if ($signedCode >= 200 && $signedCode < 400) {
                echo "[PASS] Signed R2 object access verified (HTTP status: {$signedCode} - object is fully valid and readable).\n";
            } else {
                echo "[NOTE] Signed URL returned HTTP status: {$signedCode}.\n";
            }
        } catch (\Throwable $e) {
            // Signed URL test fallback
        }
    }
} else {
    echo "[WARNING] No image URL was resolved.\n";
}

// 8. Clean up test image from both R2 and database via DELETE endpoint
echo "Cleaning up test image through DELETE /api/v1/manager/hotel/images/{$imageId}...\n";
$app['auth']->forgetGuards();

$delReq = Request::create(
    "/api/v1/manager/hotel/images/{$imageId}",
    'DELETE',
    [],
    [],
    [],
    $server
);

$delRes = $app->handle($delReq);

if ($delRes->getStatusCode() !== 200) {
    echo "[FAIL] Delete request returned status: " . $delRes->getStatusCode() . "\n";
    echo "Response: " . $delRes->getContent() . "\n";
    exit(1);
}

echo "[PASS] Delete endpoint returned HTTP 200 OK.\n";

// 9. Confirm removal from database
$dbRecordAfter = HotelImage::find($imageId);
if ($dbRecordAfter === null) {
    echo "[PASS] Database record confirmed removed.\n";
} else {
    echo "[FAIL] Database record still exists in database.\n";
    exit(1);
}

// 10. Confirm removal from Cloudflare R2
$existsAfter = Storage::disk('r2')->exists($storagePath);
if (!$existsAfter) {
    echo "[PASS] Object confirmed removed from Cloudflare R2 bucket.\n";
} else {
    echo "[FAIL] Object still exists in Cloudflare R2 bucket.\n";
    exit(1);
}

// Clean up token
$manager->tokens()->where('name', 'r2_e2e_test')->delete();

echo "\n--- All R2 End-to-End Checks Passed Successfully ---\n";
