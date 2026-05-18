<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|min:4',
        ]);

        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'User already exists'], 400);
        }

        $role = str_contains(strtolower($request->email), 'admin') ? 'admin' : 'user';

        $user = User::create([
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'role'         => $role,
            'subscription' => $request->subscription ?? 'free',
        ]);
        $user->refresh(); // load DB-level defaults

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            '_id'              => $user->id,
            'email'            => $user->email,
            'role'             => $user->role,
            'subscription'     => $user->subscription,
            'electricityPrice' => $user->electricity_price,
            'homeSize'         => $user->home_size,
            'currency'         => $user->currency,
            'token'            => $token,
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Auto-create if not exists (matches original behavior)
        if (!$user) {
            $role = str_contains(strtolower($request->email), 'admin') ? 'admin' : 'user';
            $user = User::create([
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => $role,
            ]);
            $user->refresh();
        } elseif (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }

        // Revoke old tokens and issue new one
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            '_id'              => $user->id,
            'email'            => $user->email,
            'role'             => $user->role,
            'subscription'     => $user->subscription,
            'electricityPrice' => $user->electricity_price,
            'homeSize'         => $user->home_size,
            'currency'         => $user->currency,
            'token'            => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    /**
     * GET /api/auth/profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        return response()->json([
            '_id'              => $user->id,
            'email'            => $user->email,
            'role'             => $user->role,
            'subscription'     => $user->subscription,
            'electricityPrice' => $user->electricity_price,
            'homeSize'         => $user->home_size,
            'currency'         => $user->currency,
        ]);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $user->electricity_price = $request->electricityPrice ?? $user->electricity_price;
        $user->home_size         = $request->homeSize ?? $user->home_size;
        $user->currency          = $request->currency ?? $user->currency;
        $user->save();

        return response()->json([
            '_id'              => $user->id,
            'email'            => $user->email,
            'role'             => $user->role,
            'electricityPrice' => $user->electricity_price,
            'homeSize'         => $user->home_size,
            'currency'         => $user->currency,
        ]);
    }
}
