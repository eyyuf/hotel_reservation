<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    public function guestShow(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function receptionistShow(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function managerIndex(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function managerShow(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
