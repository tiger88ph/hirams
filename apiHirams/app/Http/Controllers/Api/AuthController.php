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
        $request->validate([
            'strUserName' => 'required|string',
            'strPassword' => 'required|string',
        ]);

        $strUserName = $request->input('strUserName');
        $strPassword = $request->input('strPassword');

        $user = User::whereRaw('BINARY strUserName = ?', [$strUserName])
            ->where('cStatus', 'A')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'username_error',
            ], 404);
        }

        if (!Hash::check($strPassword, $user->strPassword)) {
            return response()->json([
                'success' => false,
                'message' => 'password_error',
            ], 401);
        }

        // ⭐ Presence update
        $user->bIsActive = 0;
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }
public function logout(Request $request)
{
    $request->validate([
        'nUserId' => 'required|integer',
    ]);

    $user = User::find($request->nUserId);

    if ($user) {
        $user->bIsActive = 1; // mark as inactive
        $user->save();
    }

    return response()->json(['success' => true]);
}

}
