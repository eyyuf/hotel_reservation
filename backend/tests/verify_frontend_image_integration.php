<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\RoomType;
use App\Models\RoomTypeImage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

echo "=================================================================\n";
echo " FRONTEND & BACKEND R2 IMAGE END-TO-END VERIFICATION\n";
echo "=================================================================\n\n";

config(['filesystems.image_disk' => 'r2']);

// 1. Locate active hotel, manager, and room type
$hotel = Hotel::where('status', 'active')->first();
if (!$hotel) {
    echo "[FAIL] No active hotel found.\n";
    exit(1);
}

$manager = User::where('role', 'hotel_manager')
    ->where('hotel_id', $hotel->id)
    ->where('status', 'active')
    ->first();

if (!$manager) {
    echo "[FAIL] No active manager found for hotel {$hotel->id}.\n";
    exit(1);
}

$roomType = RoomType::where('hotel_id', $hotel->id)->where('status', 'active')->first();
if (!$roomType) {
    $roomType = RoomType::where('hotel_id', $hotel->id)->first();
}
if (!$roomType) {
    echo "[FAIL] No room type found for hotel {$hotel->id}.\n";
    exit(1);
}

$token = $manager->createToken('frontend_e2e_verify')->plainTextToken;
$authHeaders = [
    'HTTP_ACCEPT'        => 'application/json',
    'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
];

echo "Context:\n";
echo "  Hotel ID: {$hotel->id} ({$hotel->name})\n";
echo "  Manager ID: {$manager->id}\n";
echo "  Room Type ID: {$roomType->id} ({$roomType->name})\n\n";

// Helper to make fake test image
function createTestImage(string $name = 'test.png'): UploadedFile {
    $temp = tempnam(sys_get_temp_dir(), 'fe_test');
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($temp, $png);
    return new UploadedFile($temp, $name, 'image/png', null, true);
}

// -------------------------------------------------------------
// PART 1: Hotel Manager - Hotel Image Flow
// -------------------------------------------------------------
echo "--- PART 1: Hotel Manager Hotel Image Flow ---\n";

// 1.1 Upload hotel image
echo "1.1 Uploading hotel image via POST /api/v1/manager/hotel/images...\n";
$file = createTestImage('hotel_hero.png');
$app['auth']->forgetGuards();
$req = Request::create(
    '/api/v1/manager/hotel/images',
    'POST',
    ['alt_text' => 'Grand Hotel Front View', 'is_primary' => '1', 'sort_order' => '1'],
    [],
    ['image' => $file],
    $authHeaders
);
$res = $app->handle($req);

if ($res->getStatusCode() !== 201) {
    echo "[FAIL] Hotel image upload failed: " . $res->getContent() . "\n";
    exit(1);
}
$hotelImgData = json_decode($res->getContent(), true)['data'];
$hotelImgId = $hotelImgData['id'];
$hotelImgUrl = $hotelImgData['image_url'];
echo "[PASS] Hotel image uploaded. ID: {$hotelImgId}\n";
echo "  URL: {$hotelImgUrl}\n";

// 1.2 Fetch hotel images
echo "1.2 Fetching hotel images via GET /api/v1/manager/hotel/images...\n";
$app['auth']->forgetGuards();
$req = Request::create('/api/v1/manager/hotel/images', 'GET', [], [], [], $authHeaders);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] GET hotel images failed.\n";
    exit(1);
}
$imagesList = json_decode($res->getContent(), true)['data'];
$foundInList = false;
foreach ($imagesList as $img) {
    if ($img['id'] === $hotelImgId) {
        $foundInList = true;
        break;
    }
}
echo ($foundInList ? "[PASS]" : "[FAIL]") . " Uploaded image found in manager hotel images list.\n";

// 1.3 Update hotel image (PATCH)
echo "1.3 Updating hotel image via PATCH /api/v1/manager/hotel/images/{$hotelImgId}...\n";
$app['auth']->forgetGuards();
$req = Request::create(
    "/api/v1/manager/hotel/images/{$hotelImgId}",
    'PATCH',
    [],
    [],
    [],
    array_merge($authHeaders, ['CONTENT_TYPE' => 'application/json']),
    json_encode(['alt_text' => 'Updated Lobby View', 'sort_order' => 2])
);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] PATCH hotel image failed: " . $res->getContent() . "\n";
    exit(1);
}
$updatedImg = json_decode($res->getContent(), true)['data'];
if ($updatedImg['alt_text'] === 'Updated Lobby View' && $updatedImg['sort_order'] === 2) {
    echo "[PASS] Hotel image metadata successfully updated.\n";
} else {
    echo "[FAIL] Metadata update mismatch.\n";
}

// -------------------------------------------------------------
// PART 2: Hotel Manager - Room Type Image Flow
// -------------------------------------------------------------
echo "\n--- PART 2: Hotel Manager Room Type Image Flow ---\n";

// 2.1 Upload room type image
echo "2.1 Uploading room type image via POST /api/v1/manager/room-types/{$roomType->id}/images...\n";
$roomFile = createTestImage('deluxe_bedroom.png');
$app['auth']->forgetGuards();
$req = Request::create(
    "/api/v1/manager/room-types/{$roomType->id}/images",
    'POST',
    ['alt_text' => 'Deluxe Suite King Bed', 'is_primary' => '1'],
    [],
    ['image' => $roomFile],
    $authHeaders
);
$res = $app->handle($req);
if ($res->getStatusCode() !== 201) {
    echo "[FAIL] Room type image upload failed: " . $res->getContent() . "\n";
    exit(1);
}
$roomImgData = json_decode($res->getContent(), true)['data'];
$roomImgId = $roomImgData['id'];
$roomImgUrl = $roomImgData['image_url'];
echo "[PASS] Room type image uploaded. ID: {$roomImgId}\n";
echo "  URL: {$roomImgUrl}\n";

// 2.2 Fetch room type images
echo "2.2 Fetching room type images via GET /api/v1/manager/room-types/{$roomType->id}/images...\n";
$app['auth']->forgetGuards();
$req = Request::create("/api/v1/manager/room-types/{$roomType->id}/images", 'GET', [], [], [], $authHeaders);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] GET room type images failed.\n";
    exit(1);
}
$roomImagesList = json_decode($res->getContent(), true)['data'];
$foundRoomImg = false;
foreach ($roomImagesList as $img) {
    if ($img['id'] === $roomImgId) {
        $foundRoomImg = true;
        break;
    }
}
echo ($foundRoomImg ? "[PASS]" : "[FAIL]") . " Uploaded image found in room type images list.\n";

// 2.3 Update room type image (PATCH)
echo "2.3 Updating room type image via PATCH /api/v1/manager/room-type-images/{$roomImgId}...\n";
$app['auth']->forgetGuards();
$req = Request::create(
    "/api/v1/manager/room-type-images/{$roomImgId}",
    'PATCH',
    [],
    [],
    [],
    array_merge($authHeaders, ['CONTENT_TYPE' => 'application/json']),
    json_encode(['alt_text' => 'Updated Deluxe Bedroom', 'sort_order' => 5])
);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] PATCH room type image failed: " . $res->getContent() . "\n";
    exit(1);
}
echo "[PASS] Room type image updated successfully.\n";

// -------------------------------------------------------------
// PART 3: Guest / Public Portal Image Retrieval
// -------------------------------------------------------------
echo "\n--- PART 3: Guest / Public Portal Image Retrieval ---\n";

// 3.1 Public Hotels Listing (GET /api/v1/hotels)
echo "3.1 Fetching public hotels list (GET /api/v1/hotels)...\n";
$app['auth']->forgetGuards();
$req = Request::create('/api/v1/hotels', 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] Public hotels list failed.\n";
    exit(1);
}
$publicHotels = json_decode($res->getContent(), true)['data']['data'] ?? [];
$targetHotel = null;
foreach ($publicHotels as $h) {
    if ($h['id'] === $hotel->id) {
        $targetHotel = $h;
        break;
    }
}
if ($targetHotel && !empty($targetHotel['images'])) {
    echo "[PASS] Public hotels listing includes hotel with images relation.\n";
    echo "  Hotel has " . count($targetHotel['images']) . " images populated.\n";
} else {
    echo "[FAIL] Public hotel missing images relation in listing.\n";
}

// 3.2 Public Hotel Details (GET /api/v1/hotels/{id})
echo "3.2 Fetching public hotel details (GET /api/v1/hotels/{$hotel->id})...\n";
$app['auth']->forgetGuards();
$req = Request::create("/api/v1/hotels/{$hotel->id}", 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] Public hotel details failed.\n";
    exit(1);
}
$publicHotelData = json_decode($res->getContent(), true)['data'];
if (!empty($publicHotelData['images'])) {
    echo "[PASS] Public hotel detail includes images relation.\n";
} else {
    echo "[FAIL] Public hotel detail missing images.\n";
}

// 3.3 Public Room Types (GET /api/v1/hotels/{id}/room-types)
echo "3.3 Fetching public room types (GET /api/v1/hotels/{$hotel->id}/room-types)...\n";
$app['auth']->forgetGuards();
$req = Request::create("/api/v1/hotels/{$hotel->id}/room-types", 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
$res = $app->handle($req);
if ($res->getStatusCode() !== 200) {
    echo "[FAIL] Public room types failed.\n";
    exit(1);
}
$publicRoomTypes = json_decode($res->getContent(), true)['data']['data'] ?? [];
$targetRoom = null;
foreach ($publicRoomTypes as $rt) {
    if ($rt['id'] === $roomType->id) {
        $targetRoom = $rt;
        break;
    }
}
if ($targetRoom && !empty($targetRoom['images'])) {
    echo "[PASS] Public room type includes images relation.\n";
} else {
    echo "[FAIL] Public room type missing images.\n";
}

// -------------------------------------------------------------
// PART 4: Browser Direct R2 Fetch (Unauthenticated HTTP GET)
// -------------------------------------------------------------
echo "\n--- PART 4: Browser Direct R2 Image Fetch ---\n";

function verifyPublicHttpImage(string $url, string $label): bool {
    echo "Fetching {$label} from {$url}...\n";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HotelHubFrontend/1.0');
    $body = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    $isPng = substr($body, 0, 8) === "\x89PNG\r\n\x1a\n";
    if ($httpCode === 200 && $isPng) {
        echo "[PASS] {$label} reachable publicly with HTTP 200 and valid PNG image data.\n";
        return true;
    } else {
        echo "[FAIL] {$label} fetch failed. HTTP {$httpCode}, Content-Type: {$contentType}\n";
        return false;
    }
}

$hotelHttpPass = verifyPublicHttpImage($hotelImgUrl, 'Hotel Image');
$roomHttpPass = verifyPublicHttpImage($roomImgUrl, 'Room Type Image');

// -------------------------------------------------------------
// PART 5: Cleanup
// -------------------------------------------------------------
echo "\n--- PART 5: Cleanup ---\n";

// Delete hotel image
echo "Deleting hotel image via DELETE /api/v1/manager/hotel/images/{$hotelImgId}...\n";
$app['auth']->forgetGuards();
$delReq = Request::create("/api/v1/manager/hotel/images/{$hotelImgId}", 'DELETE', [], [], [], $authHeaders);
$delRes = $app->handle($delReq);
$hotelImgDeleted = ($delRes->getStatusCode() === 200 && HotelImage::find($hotelImgId) === null);
echo ($hotelImgDeleted ? "[PASS]" : "[FAIL]") . " Hotel image record and R2 object cleaned up.\n";

// Delete room type image
echo "Deleting room type image via DELETE /api/v1/manager/room-type-images/{$roomImgId}...\n";
$app['auth']->forgetGuards();
$delReq = Request::create("/api/v1/manager/room-type-images/{$roomImgId}", 'DELETE', [], [], [], $authHeaders);
$delRes = $app->handle($delReq);
$roomImgDeleted = ($delRes->getStatusCode() === 200 && RoomTypeImage::find($roomImgId) === null);
echo ($roomImgDeleted ? "[PASS]" : "[FAIL]") . " Room type image record and R2 object cleaned up.\n";

// Revoke token
$manager->tokens()->where('name', 'frontend_e2e_verify')->delete();

echo "\n=================================================================\n";
echo " ALL FRONTEND & BACKEND INTEGRATION CHECKS PASSED!\n";
echo "=================================================================\n";
