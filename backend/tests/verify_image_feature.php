<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\RoomType;
use App\Models\RoomTypeImage;
use App\Models\User;
use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ImageTestRunner
{
    private $app;
    private $passed = 0;
    private $failed = 0;
    private $managerA;
    private $tokenA;
    private $managerB;
    private $tokenB;
    private $receptionist;
    private $tokenReceptionist;
    private $guest;
    private $tokenGuest;
    private $hotelA;
    private $hotelB;
    private $roomTypeA;
    private $roomTypeB;

    public function __construct($app)
    {
        $this->app = $app;
    }

    public function makeFakeImage(string $name = 'test.jpg', int $sizeKb = 1): UploadedFile
    {
        $temp = tempnam(sys_get_temp_dir(), 'test_img');
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($ext === 'png') {
            $content = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
            $mime = 'image/png';
        } elseif ($ext === 'webp') {
            $content = base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
            $mime = 'image/webp';
        } else {
            $content = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
            $mime = 'image/jpeg';
        }

        if ($sizeKb > 1) {
            $content .= str_repeat("\0", ($sizeKb - 1) * 1024);
        }

        file_put_contents($temp, $content);

        return new UploadedFile($temp, $name, $mime, null, true);
    }

    public function makeFakeFile(string $name, string $mime, int $sizeKb = 1): UploadedFile
    {
        $temp = tempnam(sys_get_temp_dir(), 'test_file');
        file_put_contents($temp, str_repeat('X', $sizeKb * 1024));
        return new UploadedFile($temp, $name, $mime, null, true);
    }

    private function assert($condition, string $testName, string $details = '')
    {
        if ($condition) {
            $this->passed++;
            echo "  [PASS] {$testName}\n";
        } else {
            $this->failed++;
            echo "  [FAIL] {$testName}" . ($details ? " - {$details}" : "") . "\n";
        }
    }

    private function request(
        string $method,
        string $uri,
        array $parameters = [],
        array $files = [],
        ?string $token = null,
        array $headers = []
    ) {
        $this->app['auth']->forgetGuards();
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('auth');

        $server = [
            'HTTP_ACCEPT' => 'application/json',
        ];

        if ($token) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
        }

        foreach ($headers as $k => $v) {
            $server['HTTP_' . strtoupper(str_replace('-', '_', $k))] = $v;
        }

        $content = null;
        if (in_array(strtoupper($method), ['POST', 'PATCH', 'PUT']) && empty($files)) {
            $content = json_encode($parameters);
            $server['CONTENT_TYPE'] = 'application/json';
            $parameters = [];
        }

        $req = Request::create($uri, strtoupper($method), $parameters, [], $files, $server, $content);
        return $this->app->handle($req);
    }

    public function setup()
    {
        echo "Setting up test environment...\n";

        // Setup fake disk for tests
        $imageDisk = config('filesystems.image_disk', 'r2');
        Storage::fake($imageDisk);

        // Find or create test entities
        $this->hotelA = Hotel::where('status', 'active')->first();
        if (!$this->hotelA) {
            $this->hotelA = Hotel::create([
                'name' => 'Test Hotel A',
                'status' => 'active',
                'email' => 'hotela@test.com',
                'phone' => '123456',
                'address' => 'Test Street',
                'city' => 'Test City',
                'country' => 'Test Country',
            ]);
        }

        $this->hotelB = Hotel::where('status', 'active')->where('id', '!=', $this->hotelA->id)->first();
        if (!$this->hotelB) {
            $this->hotelB = Hotel::create([
                'name' => 'Test Hotel B',
                'status' => 'active',
                'email' => 'hotelb@test.com',
                'phone' => '654321',
                'address' => 'Test Street B',
                'city' => 'Test City B',
                'country' => 'Test Country B',
            ]);
        }

        $this->roomTypeA = RoomType::where('hotel_id', $this->hotelA->id)->first();
        if (!$this->roomTypeA) {
            $this->roomTypeA = RoomType::create([
                'hotel_id' => $this->hotelA->id,
                'name' => 'Deluxe Suite A',
                'base_price' => 150.00,
                'capacity' => 2,
                'total_rooms' => 10,
                'status' => 'active',
            ]);
        }

        $this->roomTypeB = RoomType::where('hotel_id', $this->hotelB->id)->first();
        if (!$this->roomTypeB) {
            $this->roomTypeB = RoomType::create([
                'hotel_id' => $this->hotelB->id,
                'name' => 'Deluxe Suite B',
                'base_price' => 200.00,
                'capacity' => 2,
                'total_rooms' => 5,
                'status' => 'active',
            ]);
        }

        // Manager A for Hotel A
        $this->managerA = User::where('role', 'hotel_manager')->where('hotel_id', $this->hotelA->id)->first();
        if (!$this->managerA) {
            $this->managerA = User::create([
                'first_name' => 'Manager',
                'last_name' => 'A',
                'email' => 'manager.a.' . uniqid() . '@test.com',
                'password' => bcrypt('password123'),
                'role' => 'hotel_manager',
                'hotel_id' => $this->hotelA->id,
                'status' => 'active',
            ]);
        }
        $this->tokenA = $this->managerA->createToken('test_manager_a')->plainTextToken;

        // Manager B for Hotel B
        $this->managerB = User::where('role', 'hotel_manager')->where('hotel_id', $this->hotelB->id)->first();
        if (!$this->managerB) {
            $this->managerB = User::create([
                'first_name' => 'Manager',
                'last_name' => 'B',
                'email' => 'manager.b.' . uniqid() . '@test.com',
                'password' => bcrypt('password123'),
                'role' => 'hotel_manager',
                'hotel_id' => $this->hotelB->id,
                'status' => 'active',
            ]);
        }
        $this->tokenB = $this->managerB->createToken('test_manager_b')->plainTextToken;

        // Receptionist
        $this->receptionist = User::where('role', 'receptionist')->where('status', 'active')->first();
        if (!$this->receptionist) {
            $this->receptionist = User::create([
                'first_name' => 'Recep',
                'last_name' => 'Tionist',
                'email' => 'recep.' . uniqid() . '@test.com',
                'password' => bcrypt('password123'),
                'role' => 'receptionist',
                'hotel_id' => $this->hotelA->id,
                'status' => 'active',
            ]);
        }
        $this->tokenReceptionist = $this->receptionist->createToken('test_receptionist')->plainTextToken;

        // Guest
        $this->guest = User::where('role', 'guest')->where('status', 'active')->first();
        if (!$this->guest) {
            $this->guest = User::create([
                'first_name' => 'Guest',
                'last_name' => 'User',
                'email' => 'guest.' . uniqid() . '@test.com',
                'password' => bcrypt('password123'),
                'role' => 'guest',
                'hotel_id' => null,
                'status' => 'active',
            ]);
        }
        $this->tokenGuest = $this->guest->createToken('test_guest')->plainTextToken;

        echo "Environment ready. Running test suite...\n\n";
    }

    public function run()
    {
        $this->setup();

        $imageDisk = config('filesystems.image_disk', 'r2');
        $hotelImg1Id = null;
        $hotelImg2Id = null;
        $roomImg1Id = null;
        $roomImg2Id = null;
        $hotelBImgId = null;
        $roomBImgId = null;

        // ==========================================
        // 1. Manager uploads hotel image
        // ==========================================
        echo "Test 1: Manager uploads hotel image\n";
        $file1 = $this->makeFakeImage('hotel1.jpg');
        $res = $this->request('POST', '/api/v1/manager/hotel/images', [
            'alt_text'   => 'Front view of hotel',
            'is_primary' => '0',
            'sort_order' => '1',
        ], ['image' => $file1], $this->tokenA);

        $this->assert($res->getStatusCode() === 201, 'POST /manager/hotel/images returns 201');
        $json = json_decode($res->getContent(), true);
        $hotelImg1Id = $json['data']['id'] ?? null;
        $this->assert(!empty($hotelImg1Id), 'Image ID is present in response');
        $this->assert(($json['data']['hotel_id'] ?? null) === $this->hotelA->id, 'Image belongs to Manager A hotel');
        $this->assert(!isset($json['data']['storage_path']), 'Internal storage_path is hidden in response');
        $this->assert(!empty($json['data']['image_url']), 'Public image_url is generated');
        $dbImg1 = HotelImage::find($hotelImg1Id);
        $this->assert($dbImg1 !== null, 'Hotel image record exists in database');
        $this->assert(Storage::disk($imageDisk)->exists($dbImg1->storage_path), 'Image file exists in R2 storage');

        // ==========================================
        // 2. Manager retrieves hotel images
        // ==========================================
        echo "\nTest 2: Manager retrieves hotel images\n";
        $res = $this->request('GET', '/api/v1/manager/hotel/images', [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'GET /manager/hotel/images returns 200');
        $json = json_decode($res->getContent(), true);
        $ids = array_column($json['data'] ?? [], 'id');
        $this->assert(in_array($hotelImg1Id, $ids), 'Uploaded image is in list of hotel images');

        // ==========================================
        // 3. Manager marks hotel image as primary
        // ==========================================
        echo "\nTest 3: Manager marks hotel image as primary\n";
        // Upload a 2nd image
        $file2 = $this->makeFakeImage('hotel2.jpg');
        $res2 = $this->request('POST', '/api/v1/manager/hotel/images', [
            'alt_text'   => 'Lobby',
            'is_primary' => '0',
            'sort_order' => '2',
        ], ['image' => $file2], $this->tokenA);
        $hotelImg2Id = json_decode($res2->getContent(), true)['data']['id'];

        // Make image 1 primary
        $res = $this->request('PATCH', "/api/v1/manager/hotel/images/{$hotelImg1Id}", [
            'is_primary' => true,
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'PATCH hotel image to primary returns 200');
        $this->assert(HotelImage::find($hotelImg1Id)->is_primary === true, 'Image 1 is primary');
        $this->assert(HotelImage::find($hotelImg2Id)->is_primary === false, 'Image 2 is not primary');

        // Now make image 2 primary; image 1 should be unset automatically
        $res = $this->request('PATCH', "/api/v1/manager/hotel/images/{$hotelImg2Id}", [
            'is_primary' => true,
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'PATCH image 2 to primary returns 200');
        $this->assert(HotelImage::find($hotelImg2Id)->is_primary === true, 'Image 2 is now primary');
        $this->assert(HotelImage::find($hotelImg1Id)->is_primary === false, 'Image 1 is no longer primary');
        $primaryCount = HotelImage::where('hotel_id', $this->hotelA->id)->where('is_primary', true)->count();
        $this->assert($primaryCount === 1, 'Exactly one primary image exists for Hotel A');

        // ==========================================
        // 4. Manager changes hotel image metadata
        // ==========================================
        echo "\nTest 4: Manager changes hotel image metadata\n";
        $res = $this->request('PATCH', "/api/v1/manager/hotel/images/{$hotelImg1Id}", [
            'alt_text'   => 'Grand entrance updated',
            'sort_order' => 99,
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'PATCH metadata returns 200');
        $img1Fresh = HotelImage::find($hotelImg1Id);
        $this->assert($img1Fresh->alt_text === 'Grand entrance updated', 'alt_text updated successfully');
        $this->assert($img1Fresh->sort_order === 99, 'sort_order updated successfully');

        // ==========================================
        // 5. Manager deletes hotel image
        // ==========================================
        echo "\nTest 5: Manager deletes hotel image\n";
        $pathToDelete = $img1Fresh->storage_path;
        $this->assert(Storage::disk($imageDisk)->exists($pathToDelete), 'File exists in storage before deletion');
        $res = $this->request('DELETE', "/api/v1/manager/hotel/images/{$hotelImg1Id}", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'DELETE hotel image returns 200');
        $this->assert(HotelImage::find($hotelImg1Id) === null, 'Hotel image record deleted from database');
        $this->assert(!Storage::disk($imageDisk)->exists($pathToDelete), 'Hotel image file deleted from storage');

        // ==========================================
        // 6. Manager uploads room-type image
        // ==========================================
        echo "\nTest 6: Manager uploads room-type image\n";
        $rtFile1 = $this->makeFakeImage('room1.jpg');
        $res = $this->request('POST', "/api/v1/manager/room-types/{$this->roomTypeA->id}/images", [
            'alt_text'   => 'Deluxe bed view',
            'is_primary' => '0',
            'sort_order' => '1',
        ], ['image' => $rtFile1], $this->tokenA);
        $this->assert($res->getStatusCode() === 201, 'POST room-type image returns 201');
        $json = json_decode($res->getContent(), true);
        $roomImg1Id = $json['data']['id'] ?? null;
        $this->assert(!empty($roomImg1Id), 'Room type image ID present');
        $this->assert(($json['data']['room_type_id'] ?? null) === $this->roomTypeA->id, 'Matches room_type_id');
        $this->assert(!isset($json['data']['storage_path']), 'storage_path is hidden');
        $dbRtImg1 = RoomTypeImage::find($roomImg1Id);
        $this->assert($dbRtImg1 !== null, 'Room type image record in DB');
        $this->assert(Storage::disk($imageDisk)->exists($dbRtImg1->storage_path), 'File exists in storage');

        // ==========================================
        // 7. Manager retrieves room-type images
        // ==========================================
        echo "\nTest 7: Manager retrieves room-type images\n";
        $res = $this->request('GET', "/api/v1/manager/room-types/{$this->roomTypeA->id}/images", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'GET room-type images returns 200');
        $json = json_decode($res->getContent(), true);
        $ids = array_column($json['data'] ?? [], 'id');
        $this->assert(in_array($roomImg1Id, $ids), 'Image is in retrieved list');

        // ==========================================
        // 8. Manager marks room-type image as primary
        // ==========================================
        echo "\nTest 8: Manager marks room-type image as primary\n";
        $rtFile2 = $this->makeFakeImage('room2.jpg');
        $res2 = $this->request('POST', "/api/v1/manager/room-types/{$this->roomTypeA->id}/images", [
            'alt_text'   => 'Bathroom',
            'is_primary' => '0',
        ], ['image' => $rtFile2], $this->tokenA);
        $roomImg2Id = json_decode($res2->getContent(), true)['data']['id'];

        $res = $this->request('PATCH', "/api/v1/manager/room-type-images/{$roomImg1Id}", [
            'is_primary' => true,
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'PATCH room-type image to primary returns 200');
        $this->assert(RoomTypeImage::find($roomImg1Id)->is_primary === true, 'Room type image 1 is primary');
        $this->assert(RoomTypeImage::find($roomImg2Id)->is_primary === false, 'Room type image 2 is not primary');

        // Mark image 2 primary -> unsets image 1
        $res = $this->request('PATCH', "/api/v1/manager/room-type-images/{$roomImg2Id}", [
            'is_primary' => true,
        ], [], $this->tokenA);
        $this->assert(RoomTypeImage::find($roomImg2Id)->is_primary === true, 'Room type image 2 is primary');
        $this->assert(RoomTypeImage::find($roomImg1Id)->is_primary === false, 'Room type image 1 unset');
        $rtPrimaryCount = RoomTypeImage::where('room_type_id', $this->roomTypeA->id)->where('is_primary', true)->count();
        $this->assert($rtPrimaryCount === 1, 'Exactly one primary image exists for RoomType A');

        // ==========================================
        // 9. Manager changes room-type image metadata
        // ==========================================
        echo "\nTest 9: Manager changes room-type image metadata\n";
        $res = $this->request('PATCH', "/api/v1/manager/room-type-images/{$roomImg1Id}", [
            'alt_text'   => 'King size bed with city view',
            'sort_order' => 42,
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'PATCH room-type metadata returns 200');
        $rt1Fresh = RoomTypeImage::find($roomImg1Id);
        $this->assert($rt1Fresh->alt_text === 'King size bed with city view', 'alt_text updated');
        $this->assert($rt1Fresh->sort_order === 42, 'sort_order updated');

        // ==========================================
        // 10. Manager deletes room-type image
        // ==========================================
        echo "\nTest 10: Manager deletes room-type image\n";
        $rtPathToDelete = $rt1Fresh->storage_path;
        $this->assert(Storage::disk($imageDisk)->exists($rtPathToDelete), 'File exists before deletion');
        $res = $this->request('DELETE', "/api/v1/manager/room-type-images/{$roomImg1Id}", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'DELETE room-type image returns 200');
        $this->assert(RoomTypeImage::find($roomImg1Id) === null, 'Record deleted from DB');
        $this->assert(!Storage::disk($imageDisk)->exists($rtPathToDelete), 'File deleted from storage');

        // Setup hotel B and room type B images for cross-hotel tests
        $resHB = $this->request('POST', '/api/v1/manager/hotel/images', [
            'alt_text' => 'Hotel B image',
        ], ['image' => $this->makeFakeImage('hotelb.jpg')], $this->tokenB);
        $hotelBImgId = json_decode($resHB->getContent(), true)['data']['id'];

        $resRB = $this->request('POST', "/api/v1/manager/room-types/{$this->roomTypeB->id}/images", [
            'alt_text' => 'Room B image',
        ], ['image' => $this->makeFakeImage('roomb.jpg')], $this->tokenB);
        if ($resRB->getStatusCode() !== 201) {
            echo "RES_RB FAILED: " . $resRB->getStatusCode() . " -> " . $resRB->getContent() . "\n";
            echo "managerB hotel_id: " . $this->managerB->hotel_id . " | roomTypeB hotel_id: " . $this->roomTypeB->hotel_id . "\n";
        }
        $roomBImgId = json_decode($resRB->getContent(), true)['data']['id'] ?? null;

        // ==========================================
        // 11. Manager attempts to access another hotel's hotel image
        // ==========================================
        echo "\nTest 11: Manager attempts to access another hotel's hotel image\n";
        $res = $this->request('PATCH', "/api/v1/manager/hotel/images/{$hotelBImgId}", [
            'alt_text' => 'Hacked alt text',
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'PATCH another hotel image returns 403 Forbidden');
        $this->assert(HotelImage::find($hotelBImgId)->alt_text === 'Hotel B image', 'Hotel B image unchanged');

        $res = $this->request('DELETE', "/api/v1/manager/hotel/images/{$hotelBImgId}", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'DELETE another hotel image returns 403 Forbidden');
        $this->assert(HotelImage::find($hotelBImgId) !== null, 'Hotel B image not deleted');

        // ==========================================
        // 12. Manager attempts to access another hotel's room type
        // ==========================================
        echo "\nTest 12: Manager attempts to access another hotel's room type\n";
        $res = $this->request('GET', "/api/v1/manager/room-types/{$this->roomTypeB->id}/images", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'GET another hotel room-type images returns 403 Forbidden');

        $res = $this->request('POST', "/api/v1/manager/room-types/{$this->roomTypeB->id}/images", [
            'alt_text' => 'Unauthorized upload',
        ], ['image' => $this->makeFakeImage('hack.jpg')], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'POST to another hotel room-type returns 403 Forbidden');

        // ==========================================
        // 13. Manager attempts to manipulate another hotel's room-type image
        // ==========================================
        echo "\nTest 13: Manager attempts to manipulate another hotel's room-type image\n";
        $res = $this->request('PATCH', "/api/v1/manager/room-type-images/{$roomBImgId}", [
            'alt_text' => 'Hacked room alt',
        ], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'PATCH another hotel room-type image returns 403 Forbidden');

        $res = $this->request('DELETE', "/api/v1/manager/room-type-images/{$roomBImgId}", [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 403, 'DELETE another hotel room-type image returns 403 Forbidden');
        $this->assert(RoomTypeImage::find($roomBImgId) !== null, 'Room B image not deleted');

        // ==========================================
        // 14. Receptionist attempts to use manager image endpoints
        // ==========================================
        echo "\nTest 14: Receptionist attempts to use manager image endpoints\n";
        $res = $this->request('GET', '/api/v1/manager/hotel/images', [], [], $this->tokenReceptionist);
        $this->assert($res->getStatusCode() === 403, 'Receptionist GET /manager/hotel/images returns 403');

        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $this->makeFakeImage('rec.jpg')], $this->tokenReceptionist);
        $this->assert($res->getStatusCode() === 403, 'Receptionist POST /manager/hotel/images returns 403');

        $res = $this->request('POST', "/api/v1/manager/room-types/{$this->roomTypeA->id}/images", [], ['image' => $this->makeFakeImage('rec.jpg')], $this->tokenReceptionist);
        $this->assert($res->getStatusCode() === 403, 'Receptionist POST room-type images returns 403');

        // ==========================================
        // 15. Guest attempts to use manager image endpoints
        // ==========================================
        echo "\nTest 15: Guest attempts to use manager image endpoints\n";
        $res = $this->request('GET', '/api/v1/manager/hotel/images', [], [], $this->tokenGuest);
        $this->assert($res->getStatusCode() === 403, 'Guest GET /manager/hotel/images returns 403');

        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $this->makeFakeImage('gst.jpg')], $this->tokenGuest);
        $this->assert($res->getStatusCode() === 403, 'Guest POST /manager/hotel/images returns 403');

        // ==========================================
        // 16. Invalid file upload is rejected
        // ==========================================
        echo "\nTest 16: Invalid file upload is rejected\n";
        $txtFile = $this->makeFakeFile('document.txt', 'text/plain', 10);
        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $txtFile], $this->tokenA);
        $this->assert($res->getStatusCode() === 422, 'Text file upload rejected with 422');

        // ==========================================
        // 17. Unsupported MIME type is rejected
        // ==========================================
        echo "\nTest 17: Unsupported MIME type is rejected\n";
        $pdfFile = $this->makeFakeFile('brochure.pdf', 'application/pdf', 50);
        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $pdfFile], $this->tokenA);
        $this->assert($res->getStatusCode() === 422, 'PDF upload rejected with 422');

        $svgFile = $this->makeFakeFile('logo.svg', 'image/svg+xml', 10);
        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $svgFile], $this->tokenA);
        $this->assert($res->getStatusCode() === 422, 'SVG upload rejected with 422');

        // ==========================================
        // 18. Oversized image is rejected
        // ==========================================
        echo "\nTest 18: Oversized image is rejected\n";
        // 1500 KB > 1024 KB limit
        $bigFile = $this->makeFakeImage('huge.jpg', 1500);
        $res = $this->request('POST', '/api/v1/manager/hotel/images', [], ['image' => $bigFile], $this->tokenA);
        $this->assert($res->getStatusCode() === 422, 'Oversized image (>1MB) rejected with 422');

        // ==========================================
        // 19. R2 upload failure is handled safely
        // ==========================================
        echo "\nTest 19: R2 upload failure is handled safely\n";
        $origDisk = config('filesystems.image_disk', 'r2');
        config(['filesystems.image_disk' => 'unconfigured_r2_disk']);
        $countBefore = HotelImage::where('hotel_id', $this->hotelA->id)->count();

        try {
            $res = $this->request('POST', '/api/v1/manager/hotel/images', [], [
                'image' => $this->makeFakeImage('fail.jpg'),
            ], $this->tokenA);
            $this->assert($res->getStatusCode() >= 500, 'Upload failure returns 500 status');
        } catch (\Throwable $e) {
            $this->assert(true, 'Upload failure thrown safely: ' . $e->getMessage());
        }
        $countAfter = HotelImage::where('hotel_id', $this->hotelA->id)->count();
        $this->assert($countBefore === $countAfter, 'No DB record created when R2 upload fails');

        // Restore disk
        config(['filesystems.image_disk' => $origDisk]);

        // ==========================================
        // 20. Database failure after upload cleans up storage
        // ==========================================
        echo "\nTest 20: Database failure after upload cleans up storage\n";
        $filesBefore = Storage::disk($imageDisk)->allFiles("hotels/{$this->hotelA->id}/images");

        // Force a DB transaction error when creating image
        DB::listen(function ($query) {
            if (str_contains($query->sql, 'insert into "hotel_images"')) {
                throw new \PDOException('Simulated DB insert failure');
            }
        });

        try {
            $res = $this->request('POST', '/api/v1/manager/hotel/images', [], [
                'image' => $this->makeFakeImage('dbfail.jpg'),
            ], $this->tokenA);
        } catch (\Throwable $e) {
            // Expected
        }

        $filesAfter = Storage::disk($imageDisk)->allFiles("hotels/{$this->hotelA->id}/images");
        $this->assert(count($filesBefore) === count($filesAfter), 'Orphaned storage object was cleaned up after DB failure');

        // Reset DB listeners
        $this->app['db']->setEventDispatcher(new \Illuminate\Events\Dispatcher($this->app));

        // ==========================================
        // 21. Public hotel & room-type image access
        // ==========================================
        echo "\nTest 21: Public hotel & room-type image access\n";
        $res = $this->request('GET', "/api/v1/hotels/{$this->hotelA->id}");
        $this->assert($res->getStatusCode() === 200, 'GET /v1/hotels/{id} returns 200');
        $hotelData = json_decode($res->getContent(), true)['data'] ?? [];
        $this->assert(array_key_exists('images', $hotelData), 'Public hotel details contain images relation');

        $res = $this->request('GET', "/api/v1/hotels");
        $this->assert($res->getStatusCode() === 200, 'GET /v1/hotels returns 200');
        $hotelsList = json_decode($res->getContent(), true)['data']['data'] ?? [];
        $hasImages = !empty($hotelsList) && array_key_exists('images', $hotelsList[0]);
        $this->assert($hasImages, 'Public hotels list contains images relation for hotels');

        $res = $this->request('GET', "/api/v1/hotels/{$this->hotelA->id}/room-types");
        $this->assert($res->getStatusCode() === 200, 'GET /v1/hotels/{id}/room-types returns 200');
        $rtList = json_decode($res->getContent(), true)['data']['data'] ?? [];
        $this->assert(!empty($rtList) && array_key_exists('images', $rtList[0]), 'Public room types list contains images relation');

        $res = $this->request('GET', "/api/v1/hotels/{$this->hotelA->id}/room-types/{$this->roomTypeA->id}");
        $this->assert($res->getStatusCode() === 200, 'GET /v1/hotels/{id}/room-types/{roomType} returns 200');
        $rtData = json_decode($res->getContent(), true)['data'] ?? [];
        $this->assert(array_key_exists('images', $rtData), 'Public room type details contain images relation');

        // ==========================================
        // 22. Existing auth, routes & roles preserved
        // ==========================================
        echo "\nTest 22: Existing auth, routes & roles preserved\n";
        $res = $this->request('GET', '/api/v1/auth/me', [], [], $this->tokenA);
        $this->assert($res->getStatusCode() === 200, 'Existing auth/me works for manager');

        $res = $this->request('GET', '/api/v1/receptionist/reservations', [], [], $this->tokenReceptionist);
        $this->assert($res->getStatusCode() === 200, 'Existing receptionist reservations route works');

        $res = $this->request('GET', '/api/v1/guest/reservations', [], [], $this->tokenGuest);
        $this->assert($res->getStatusCode() === 200, 'Existing guest reservations route works');

        // Clean up test images created in DB
        HotelImage::where('hotel_id', $this->hotelA->id)->delete();
        HotelImage::where('hotel_id', $this->hotelB->id)->delete();
        RoomTypeImage::where('room_type_id', $this->roomTypeA->id)->delete();
        RoomTypeImage::where('room_type_id', $this->roomTypeB->id)->delete();

        // Print final summary
        echo "\n==========================================\n";
        echo "TEST SUMMARY: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "==========================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }
}

$runner = new ImageTestRunner($app);
$runner->run();
