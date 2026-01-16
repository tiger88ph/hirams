<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $strFName = $request->input('strFName');
        // ✅ Only active users (cStatus = 'A')
        $user = User::where('strFName', $strFName)
            ->where('cStatus', 'A')
            ->first();
        if ($user) {
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'User not found or inactive.'
            ]);
        }
    }
}
