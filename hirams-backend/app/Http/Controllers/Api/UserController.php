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
            'cUserType' => 'required|string|max:1',
            'cStatus' => 'required|string|max:1',
        ]);

        $users = User::create($data);
        return response()->json($users, 201);
    }

     /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $users = User::findOrFail($id);

        $data = $request->validate([
           'strFName' => 'required|string|max:50',
            'strMName' => 'nullable|string|max:50',
            'strLName' => 'required|string|max:50',
            'strNickName' => 'required|string|max:20',
            'cUserType' => 'required|string|max:1',
            'cStatus' => 'required|string|max:1',
        ]);

        $users->update($data);

        return response()->json($users, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            // Find user by ID
            $users = User::findOrFail($id);

            // Delete the record
            $users->delete();

            // Return success response
            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'User']),
                'deleted_user' => $users
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // If user not found
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User'])
            ], 404);

        } catch (\Exception $e) {
            // Catch other errors
            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'User']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
