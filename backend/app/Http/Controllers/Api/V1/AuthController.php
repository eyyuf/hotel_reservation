<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'=>['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = User::create([
            'first_name'=>$validated['first_name'],
            'last_name'=>$validated['last_name'],
            'email'=>$validated['email'],
            'phone'=>$validated['phone'] ?? null , 
            'password'=>Hash::make($validated['password'])
        ]);

        return response()->json([
            'message' => 'Registration Successful',
            'user'=> $user,
        ], 201);
    }

    public function login(request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'=>['required','email'],
            'password'=>['required','string']
        ]);
            $user = User::where('email', $validated['email'])->first();
            if(!$user || !Hash::check($validated['password'],$user->password)){
                return response()->json([
                    'message' => 'Invalid email or password.',
                ], 401);
            };
            $token = $user->createToken('auth-token')->plainTextToken;



        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $user,
        ], 200);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function me(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }

    public function profile(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint skeleton only. Implementation pending.',
        ], 501);
    }
}
