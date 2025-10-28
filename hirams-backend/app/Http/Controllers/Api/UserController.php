<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\SqlErrors;
use App\Models\User;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    // public function index()
    // {
    //     try {
    //         $users = User::all();

    //         return response()->json([
    //             'message' => __('messages.retrieve_success', ['name' => 'Users']),
    //             'users' => $users
    //         ], 200);

    //     } catch (Exception $e) {
    //         SqlErrors::create([
    //             'dtDate' => now(),
    //             'strError' => "Error fetching users: " . $e->getMessage(),
    //         ]);

    //         return response()->json([
    //             'message' => __('messages.retrieve_failed', ['name' => 'Users']),
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }
    public function index(Request $request)
    {
        try {
            $query = User::query();

            // ✅ APPLY RO  LE FILTER
            if ($request->filled('cUserType')) {
                $query->where('cUserType', $request->cUserType);
            }

            // ✅ APPLY SEARCH
            if ($request->filled('search')) {
                $search = $request->search;

                $query->where(function ($q) use ($search) {
                    $q->where('strFName', 'LIKE', "%{$search}%")
                        ->orWhere('strMName', 'LIKE', "%{$search}%")
                        ->orWhere('strLName', 'LIKE', "%{$search}%")
                        ->orWhere('strNickName', 'LIKE', "%{$search}%");
                });
            }

            $users = $query->orderBy('strLName')->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Users']),
                'users' => $users
            ], 200);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching users: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Users']),
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'strFName' => 'required|string|max:50',
                'strMName' => 'nullable|string|max:50',
                'strLName' => 'required|string|max:50',
                'strNickName' => 'required|string|max:20',
                'cUserType' => 'required|string|max:1',
                'cStatus' => 'required|string|max:1',
            ]);

            $user = User::create($data);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'User']),
                'user' => $user
            ], 201);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating user: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'User']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $data = $request->validate([
                'strFName' => 'required|string|max:50',
                'strMName' => 'nullable|string|max:50',
                'strLName' => 'required|string|max:50',
                'strNickName' => 'required|string|max:20',
                'cUserType' => 'required|string|max:1',
                'cStatus' => 'required|string|max:1',
            ]);

            $user->update($data);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'User']),
                'user' => $user
            ], 200);

        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "User ID $id not found: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User'])
            ], 404);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating User ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'User']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'User']),
                'deleted_user' => $user
            ], 200);

        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "User ID $id not found: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User'])
            ], 404);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error deleting User ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'User']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
