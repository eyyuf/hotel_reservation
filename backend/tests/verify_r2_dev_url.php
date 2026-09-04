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

echo "=======================================================\n";
echo " Cloudflare R2 Public r2.dev URL Verification\n";
echo "=======================================================\n\n";

$results = [
    'r2_upload' => false,
    'r2_object_existence' => false,
    'public_r2_dev_url' => false,
    'http_status' => 0,
    'valid_image_response' => false,
    'cleanup' => false,
];

// 1. Read CLOUDFLARE_R2_URL from environment
$configuredUrl = env('CLOUDFLARE_R2_URL') ?: config('filesystems.disks.r2.url');

if (empty($configuredUrl)) {
    echo "[FAIL] CLOUDFLARE_R2_URL is not set in backend/.env or filesystems configuration.\n";
    exit(1);
}

$urlHost = parse_url($configuredUrl, PHP_URL_HOST);
$urlScheme = parse_url($configuredUrl, PHP_URL_SCHEME);

echo "Step 1: Inspecting configured public R2 URL...\n";
echo "  Scheme: " . ($urlScheme ?: 'none') . "\n";
echo "  Host: " . ($urlHost ?: 'none') . "\n";

// 2. Confirm the configured URL is an r2.dev public URL
$isR2Dev = !empty($urlHost) && str_ends_with(strtolower($urlHost), 'r2.dev');
$isS3Endpoint = !empty($urlHost) && str_contains(strtolower($urlHost), 'r2.cloudflarestorage.com');

if (!$isR2Dev) {
    echo "[FAIL] Configured URL is not an r2.dev domain! (Host: {$urlHost})\n";
    exit(1);
}

if ($isS3Endpoint) {
    echo "[FAIL] Configured URL is using the direct S3 API endpoint (r2.cloudflarestorage.com) rather than the public r2.dev URL.\n";
    exit(1);
}

echo "[PASS] Configured URL is a valid r2.dev public URL.\n\n";
$results['public_r2_dev_url'] = true;

// 3. Ensure disk config is ready
$diskConfig = config('filesystems.disks.r2', []);
if (empty($diskConfig['key']) || empty($diskConfig['secret']) || empty($diskConfig['bucket'])) {
    echo "[FAIL] R2 storage credentials or bucket are incomplete in configuration.\n";
    exit(1);
}
config(['filesystems.image_disk' => 'r2']);

// 4. Find active hotel and hotel manager
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

$token = $manager->createToken('r2_dev_verify')->plainTextToken;

// 5. Create valid test image
$tempPath = tempnam(sys_get_temp_dir(), 'r2_dev_test');
$pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
file_put_contents($tempPath, $pngContent);
$testFile = new UploadedFile($tempPath, 'r2_dev_test.png', 'image/png', null, true);

$server = [
    'HTTP_ACCEPT'        => 'application/json',
    'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
];

// 6. Upload test image through POST /api/v1/manager/hotel/images
echo "Step 2: Uploading test image via POST /api/v1/manager/hotel/images...\n";
$uploadReq = Request::create(
    '/api/v1/manager/hotel/images',
    'POST',
    [
        'alt_text'   => 'Public r2.dev URL Verification Image',
        'is_primary' => '0',
    ],
    [],
    ['image' => $testFile],
    $server
);

$uploadRes = $app->handle($uploadReq);

if ($uploadRes->getStatusCode() !== 201) {
    echo "[FAIL] Upload failed with HTTP status: " . $uploadRes->getStatusCode() . "\n";
    echo "Response: " . $uploadRes->getContent() . "\n";
    @unlink($tempPath);
    $manager->tokens()->where('name', 'r2_dev_verify')->delete();
    exit(1);
}

$uploadData = json_decode($uploadRes->getContent(), true)['data'] ?? [];
$imageId = $uploadData['id'] ?? null;
$imageUrl = $uploadData['image_url'] ?? null;

if (!$imageId || empty($imageUrl)) {
    echo "[FAIL] Missing image ID or image_url in upload response.\n";
    @unlink($tempPath);
    $manager->tokens()->where('name', 'r2_dev_verify')->delete();
    exit(1);
}

$results['r2_upload'] = true;
echo "[PASS] Image uploaded successfully (ID: {$imageId}).\n";
echo "  Returned image_url: {$imageUrl}\n\n";

// Fetch database record
$imageRecord = HotelImage::find($imageId);
if (!$imageRecord) {
    echo "[FAIL] Database record not found for image ID {$imageId}.\n";
    exit(1);
}
$storagePath = $imageRecord->storage_path;

// 7. Confirm object physically exists in R2 bucket
echo "Step 3: Confirming object existence in Cloudflare R2 bucket...\n";
try {
    $existsInR2 = Storage::disk('r2')->exists($storagePath);
    if ($existsInR2) {
        $results['r2_object_existence'] = true;
        echo "[PASS] Object exists in Cloudflare R2 bucket at path: {$storagePath}\n\n";
    } else {
        echo "[FAIL] Object does NOT exist in Cloudflare R2 bucket.\n";
    }
} catch (\Throwable $e) {
    echo "[FAIL] Exception checking R2 bucket: " . $e->getMessage() . "\n";
}

// 8. Confirm URL domain is r2.dev domain
echo "Step 4: Confirming URL uses configured r2.dev domain...\n";
$returnedHost = parse_url($imageUrl, PHP_URL_HOST);
if ($returnedHost === $urlHost && str_ends_with(strtolower($returnedHost), 'r2.dev')) {
    echo "[PASS] Returned URL domain matches configured r2.dev domain: {$returnedHost}\n";
    if (str_contains(strtolower($imageUrl), 'r2.cloudflarestorage.com')) {
        echo "[FAIL] Returned URL unexpectedly contains S3 API endpoint.\n";
        $results['public_r2_dev_url'] = false;
    } else {
        echo "[PASS] Returned URL does not contain S3 API endpoint.\n\n";
    }
} else {
    echo "[FAIL] Returned URL host '{$returnedHost}' does not match configured host '{$urlHost}'.\n";
    $results['public_r2_dev_url'] = false;
}

// 9. Real UNAUTHENTICATED HTTP GET request to image_url
echo "Step 5: Executing real unauthenticated HTTP GET request to public image_url...\n";
$ch = curl_init($imageUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HotelReservationTest/1.0');
// Explicitly unauthenticated: no headers passed

$responseBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);
curl_close($ch);

$results['http_status'] = $httpCode;

echo "  HTTP Status Code: {$httpCode}\n";
echo "  Content-Type: {$contentType}\n";
if ($curlError) {
    echo "  cURL Error: {$curlError}\n";
}

if ($httpCode === 200) {
    echo "[PASS] HTTP GET returned 200 OK.\n";
    
    // Check for valid image data
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    $isPng = (substr($responseBody, 0, 8) === "\x89PNG\r\n\x1a\n");
    $imageInfo = @getimagesizefromstring($responseBody);
    
    if ($isPng && $imageInfo !== false) {
        $results['valid_image_response'] = true;
        echo "[PASS] Response contains valid PNG image data (Dimensions: {$imageInfo[0]}x{$imageInfo[1]}, MIME: {$imageInfo['mime']}).\n\n";
    } elseif ($imageInfo !== false) {
        $results['valid_image_response'] = true;
        echo "[PASS] Response contains valid image data (MIME: {$imageInfo['mime']}).\n\n";
    } else {
        echo "[FAIL] Response body is not valid image data. Length: " . strlen($responseBody) . " bytes.\n\n";
    }
} else {
    echo "[FAIL] HTTP GET request failed with status code: {$httpCode}\n";
    if (strlen($responseBody) < 500) {
        echo "  Response body: " . trim($responseBody) . "\n";
    }
    echo "\n";
}

// 10. Clean up test image via existing DELETE endpoint
echo "Step 6: Deleting test image via DELETE /api/v1/manager/hotel/images/{$imageId}...\n";
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
if ($delRes->getStatusCode() === 200) {
    echo "[PASS] DELETE endpoint returned HTTP 200 OK.\n";
} else {
    echo "[FAIL] DELETE endpoint returned HTTP " . $delRes->getStatusCode() . "\n";
}

// 11. Confirm removal from PostgreSQL database and Cloudflare R2
echo "Step 7: Confirming cleanup from database and R2 bucket...\n";
$recordAfter = HotelImage::find($imageId);
$dbRemoved = ($recordAfter === null);

try {
    $existsAfter = Storage::disk('r2')->exists($storagePath);
    $r2Removed = !$existsAfter;
} catch (\Throwable $e) {
    $r2Removed = false;
}

if ($dbRemoved && $r2Removed) {
    $results['cleanup'] = true;
    echo "[PASS] PostgreSQL record confirmed deleted.\n";
    echo "[PASS] Cloudflare R2 object confirmed deleted.\n\n";
} else {
    echo "  - DB record deleted: " . ($dbRemoved ? "Yes" : "No") . "\n";
    echo "  - R2 object deleted: " . ($r2Removed ? "Yes" : "No") . "\n";
    echo "[FAIL] Cleanup incomplete.\n\n";
}

// Clean up test token and temp file
$manager->tokens()->where('name', 'r2_dev_verify')->delete();
@unlink($tempPath);

echo "=======================================================\n";
echo " Summary Results:\n";
echo "=======================================================\n";
echo "R2 upload: " . ($results['r2_upload'] ? "PASS" : "FAIL") . "\n";
echo "R2 object existence: " . ($results['r2_object_existence'] ? "PASS" : "FAIL") . "\n";
echo "Public r2.dev URL: " . ($results['public_r2_dev_url'] ? "PASS" : "FAIL") . "\n";
echo "HTTP status: " . $results['http_status'] . "\n";
echo "Valid image response: " . ($results['valid_image_response'] ? "PASS" : "FAIL") . "\n";
echo "Cleanup: " . ($results['cleanup'] ? "PASS" : "FAIL") . "\n";

$allPassed = $results['r2_upload'] &&
    $results['r2_object_existence'] &&
    $results['public_r2_dev_url'] &&
    ($results['http_status'] === 200) &&
    $results['valid_image_response'] &&
    $results['cleanup'];

exit($allPassed ? 0 : 1);
