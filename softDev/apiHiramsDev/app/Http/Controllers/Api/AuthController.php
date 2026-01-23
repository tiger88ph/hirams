<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validate input
        $request->validate([
            'strUserName' => 'required|string',
            'strPassword' => 'required|string',
        ]);

        $strUserName = $request->input('strUserName');
        $strPassword = $request->input('strPassword');

        // Find active user by username
        $user = User::where('strUserName', $strUserName)
                    ->where('cStatus', 'A')
                    ->first();

        if (!$user) {
            // Username does not exist or inactive
            return response()->json([
                'success' => false,
                'message' => 'username_error', // frontend checks this
            ], 404);
        }

        // Check hashed password using Hash::check()
        if (!Hash::check($strPassword, $user->strPassword)) {
            // Password is incorrect
            return response()->json([
                'success' => false,
                'message' => 'password_error', // frontend checks this
            ], 401);
        }

        // Successful login
        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }
}