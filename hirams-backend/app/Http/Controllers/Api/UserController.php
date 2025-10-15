<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'strFName' => 'required|string|max:50',
            'strMName' => 'nullable|string|max:50',
            'strLName' => 'required|string|max:50',
            'strNickName' => 'required|string|max:20',
            'cUserType' => 'required|char|max:1',
            'cStatus' => 'required|char|max:1',
        ]);

        $users = User::create($data);
        return response()->json($users, 201);
    }
}
