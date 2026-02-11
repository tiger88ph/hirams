<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\User;
use App\Models\SqlErrors;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;


class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = User::query();
            // ✅ APPLY ROLE FILTER
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
                'cSex' => 'required|string|max:1',
                'strEmail' => 'nullable|string|email|max:100',
                'strUserName' => 'nullable|string|max:50',
                'strPassword' => 'nullable|string|min:6',
                'cStatus' => 'required|string|max:1',
            ]);

            if (!empty($data['strPassword'])) {
                $data['strPassword'] = bcrypt($data['strPassword']);
            }

            $user = User::create($data);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'User']),
                'user' => $user
            ], 201);
        } catch (QueryException $e) {

            if ($e->errorInfo[1] == 1062) {

                $message = $e->errorInfo[2];

                // extract key name from: Duplicate entry 'x' for key 'KEYNAME'
                preg_match("/for key '([^']+)'/", $message, $matches);
                $key = $matches[1] ?? '';

                if (str_contains($key, 'strUserName')) {
                    return response()->json([
                        'message' => 'This username already exists.'
                    ], 409);
                }

                if (str_contains($key, 'strEmail')) {
                    return response()->json([
                        'message' => 'This email already exists.'
                    ], 409);
                }

                return response()->json([
                    'message' => 'Duplicate record already exists.'
                ], 409);
            }

            throw $e;
        }
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Use primary key nUserId
            $user = User::findOrFail($id);

            $data = $request->validate([
                'strFName' => 'required|string|max:50',
                'strMName' => 'nullable|string|max:50',
                'strLName' => 'required|string|max:50',
                'strNickName' => 'required|string|max:20',
                'cUserType' => 'required|string|max:1',
                'cSex' => 'required|string|max:1',
                'strEmail' => 'nullable|string|email|max:100',
                'strUserName' => 'nullable|string|max:50',
                'strPassword' => 'nullable|string|min:6',
            ]);

            // ✅ Check duplicate username (case-sensitive)
            if (!empty($data['strUserName'])) {
                $exists = User::whereRaw('BINARY strUserName = ?', [$data['strUserName']])
                    ->where('nUserId', '!=', $user->nUserId)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'message' => 'This username already exists.'
                    ], 409);
                }
            }

            // ✅ Check duplicate email (case-insensitive)
            if (!empty($data['strEmail'])) {
                $exists = User::where('strEmail', $data['strEmail'])
                    ->where('nUserId', '!=', $user->nUserId)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'message' => 'This email already exists.'
                    ], 409);
                }
            }

            // ✅ Hash password if provided
            if (!empty($data['strPassword'])) {
                $data['strPassword'] = bcrypt($data['strPassword']);
            } else {
                unset($data['strPassword']);
            }

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
    /**
     * Update user status (Active/Inactive)
     */    
public function updateStatus(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            
            // Validate status field and optional user type
            $data = $request->validate([
                'cStatus' => 'required|in:A,I,P', // A=Active, I=Inactive, P=Pending
                'cUserType' => 'nullable|string|max:1', // Optional: only required when approving pending users
            ]);
            
            // Prepare update data
            $updateData = ['cStatus' => $data['cStatus']];
            
            // If user type is provided (e.g., when approving a pending user), include it
            if (isset($data['cUserType'])) {
                $updateData['cUserType'] = $data['cUserType'];
            }
            
            $user->update($updateData);
            $user->refresh(); // Ensure we return the updated value
            
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'User Status']),
                'user' => $user
            ], 200);
        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "User ID $id not found for status update: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User'])
            ], 404);
        } catch (ValidationException $e) {
            // Handle validation errors
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating status for User ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'User Status']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Check if username or email already exists
     */
    public function checkExist(Request $request)
    {
        $request->validate([
            'strUserName' => 'nullable|string|max:50',
            'strEmail' => 'nullable|string|email|max:100',
        ]);

        $exists = false;
        $field = '';

        if ($request->filled('strUserName')) {
            $exists = User::whereRaw('BINARY strUserName = ?', [$request->strUserName])->exists();
            $field = 'username';
        }

        if (!$exists && $request->filled('strEmail')) {
            $exists = User::where('strEmail', $request->strEmail)->exists(); // keep email case-insensitive
            $field = 'email';
        }

        return response()->json([
            'exists' => $exists,
            'field' => $exists ? $field : null
        ], 200);
    }
}
