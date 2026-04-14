<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\SqlErrors;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use App\Events\UserUpdated;

class UserController extends Controller
{
    /**
     * Get all users with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query();

            if ($request->filled('cUserType')) {
                $query->where('cUserType', $request->cUserType);
            }

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
                'users'   => $users,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Users');
        }
    }
    /**
     * Get a single user by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'User']),
                'user'    => $user,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'User');
        }
    }
    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strFName'    => 'required|string|max:50',
                'strMName'    => 'nullable|string|max:50',
                'strLName'    => 'required|string|max:50',
                'strNickName' => 'required|string|max:20',
                'cUserType'   => 'required|string|max:1',
                'cSex'        => 'required|string|max:1',
                'strEmail'    => 'nullable|string|email|max:100',
                'strUserName' => 'nullable|string|max:50',
                'strPassword' => 'nullable|string|min:6',
                'cStatus'     => 'required|string|max:1',
            ]);

            if (!empty($validated['strPassword'])) {
                $validated['strPassword'] = bcrypt($validated['strPassword']);
            }

            $user = User::create($validated);
            broadcast(new UserUpdated('created', $user->nUserId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'User']),
                'user'    => $user,
            ], 201);
        } catch (QueryException $e) {
            return $this->handleDuplicateEntry($e);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'User');
        }
    }

    /**
     * Update an existing user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strFName'    => 'required|string|max:50',
                'strMName'    => 'nullable|string|max:50',
                'strLName'    => 'required|string|max:50',
                'strNickName' => 'required|string|max:20',
                'cUserType'   => 'required|string|max:1',
                'cSex'        => 'required|string|max:1',
                'strEmail'    => 'nullable|string|email|max:100',
                'strUserName' => 'nullable|string|max:50',
                'strPassword' => 'nullable|string|min:6',
            ]);

            $user = User::findOrFail($id);
            broadcast(new UserUpdated('updated', $user->nUserId))->toOthers();
            if (!empty($validated['strUserName'])) {
                $exists = User::whereRaw('BINARY strUserName = ?', [$validated['strUserName']])
                    ->where('nUserId', '!=', $user->nUserId)
                    ->exists();

                if ($exists) {
                    throw ValidationException::withMessages([
                        'strUserName' => 'This username already exists.',
                    ]);
                }
            }

            if (!empty($validated['strEmail'])) {
                $exists = User::where('strEmail', $validated['strEmail'])
                    ->where('nUserId', '!=', $user->nUserId)
                    ->exists();

                if ($exists) {
                    throw ValidationException::withMessages([
                        'strEmail' => 'This email already exists.',
                    ]);
                }
            }

            if (!empty($validated['strPassword'])) {
                $validated['strPassword'] = bcrypt($validated['strPassword']);
            } else {
                unset($validated['strPassword']);
            }

            $user->update($validated);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'User']),
                'user'    => $user,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 409);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'User');
        }
    }

    /**
     * Delete a user
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();
            broadcast(new UserUpdated('deleted', $user->nUserId))->toOthers();
            return response()->json([
                'message'      => __('messages.delete_success', ['name' => 'User']),
                'deleted_user' => $user,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'User');
        }
    }

    /**
     * Update user status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'cStatus'   => 'required|string|max:1',
                'cUserType' => 'nullable|string|max:1',
            ]);

            $user = User::findOrFail($id);

            $updateData = ['cStatus' => $validated['cStatus']];
            if (isset($validated['cUserType'])) {
                $updateData['cUserType'] = $validated['cUserType'];
            }

            $user->update($updateData);
            $user->refresh();
            broadcast(new UserUpdated('status_changed', $user->nUserId))->toOthers();


            return response()->json([
                'message' => __('messages.update_success', ['name' => 'User Status']),
                'user'    => $user,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'User Status');
        }
    }

    /**
     * Check if username or email already exists
     */
    public function checkExist(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strUserName' => 'nullable|string|max:50',
                'strEmail'    => 'nullable|string|email|max:100',
            ]);

            $exists = false;
            $field  = '';

            if (!empty($validated['strUserName'])) {
                $exists = User::whereRaw('BINARY strUserName = ?', [$validated['strUserName']])->exists();
                $field  = 'username';
            }

            if (!$exists && !empty($validated['strEmail'])) {
                $exists = User::where('strEmail', $validated['strEmail'])->exists();
                $field  = 'email';
            }

            return response()->json([
                'exists' => $exists,
                'field'  => $exists ? $field : null,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'User existence check');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function handleDuplicateEntry(QueryException $e): JsonResponse
    {
        if ($e->errorInfo[1] == 1062) {
            $message = $e->errorInfo[2];
            preg_match("/for key '([^']+)'/", $message, $matches);
            $key = $matches[1] ?? '';

            if (str_contains($key, 'strUserName')) {
                return response()->json(['message' => 'This username already exists.'], 409);
            }

            if (str_contains($key, 'strEmail')) {
                return response()->json(['message' => 'This email already exists.'], 409);
            }

            return response()->json(['message' => 'Duplicate record already exists.'], 409);
        }

        throw $e;
    }
    public function updatePassword(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strPassword' => 'required|string|min:6|confirmed',
                // strPassword_confirmation validated implicitly by 'confirmed'
            ]);

            $user = User::findOrFail($id);

            $user->update(['strPassword' => Hash::make($validated['strPassword'])]);
            broadcast(new UserUpdated('updated', $user->nUserId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Password']),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Password');
        }
    }
    /**
     * Upload and update the user's profile image.
     * Stores the file in the React app's public/profile/ folder.
     */
    /**
     * Upload and update the user's profile image.
     * Stores the file in the React app's public/profile/ folder.
     * Only the filename is saved to the database.
     */
    public function uploadProfileImage(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'strProfileImage' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:2048',
            ]);

            $user = User::findOrFail($id);

            // Normalize backslashes to forward slashes (Windows compatibility)
            $destination = rtrim(
                str_replace('\\', '/', config('app.react_public_path')),
                '/'
            ) . '/profile';

            // Delete old image before replacing
            if ($user->strProfileImage) {
                $oldPath = $destination . '/' . $user->strProfileImage;
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $file     = $request->file('strProfileImage');
            $filename = $id . '_' . time() . '.' . $file->getClientOriginalExtension();

            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            // Store image in React public/profile/ — only filename goes to DB
            $file->move($destination, $filename);

            $user->update(['strProfileImage' => $filename]);
            broadcast(new UserUpdated('updated', $user->nUserId))->toOthers();
            return response()->json([
                'message'         => __('messages.update_success', ['name' => 'Profile Image']),
                'strProfileImage' => $filename,   // ← just the filename e.g. "30_1718000000.jpg"
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'User']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Profile Image');
        }
    }
    /**
     * Get active Account Officers (for assignment dropdowns)
     * Uses user_types index 0 and 5 from mappings config
     */
    public function activeAccountOfficers(): JsonResponse
    {
        try {
            $userTypes = array_keys(config('mappings.user_types'));
            $allow     = array_filter([
                $userTypes[4] ?? null,
                $userTypes[5] ?? null,
            ]);

            $users = User::where('cStatus', 'A')
                ->whereIn('cUserType', $allow)
                ->orderBy('strLName')
                ->get(['nUserId', 'strFName', 'strLName']);

            return response()->json([
                'message'         => __('messages.retrieve_success', ['name' => 'Account Officers']),
                'accountOfficers' => $users->map(fn($u) => [
                    'value' => $u->nUserId,
                    'label' => "{$u->strFName} {$u->strLName}",
                ]),
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Account Officers');
        }
    }
    public function activeProcurement(): JsonResponse
    {
        try {
            $userTypes = array_keys(config('mappings.user_types'));
            $allow     = array_filter([
                $userTypes[2] ?? null,
                $userTypes[3] ?? null,
            ]);

            $users = User::where('cStatus', 'A')
                ->whereIn('cUserType', $allow)
                ->orderBy('strLName')
                ->get(['nUserId', 'strFName', 'strLName']);

            return response()->json([
                'message'         => __('messages.retrieve_success', ['name' => 'Procurement']),
                'procurement' => $users->map(fn($u) => [
                    'value' => $u->nUserId,
                    'label' => "{$u->strFName} {$u->strLName}",
                ]),
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Procurement');
        }
    }
    private function handleException(Exception $e, string $messageKey, string $entityName): JsonResponse
    {
        SqlErrors::create([
            'dtDate'   => TimeHelper::now(),
            'strError' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => __("messages.{$messageKey}", ['name' => $entityName]),
            'error'   => $e->getMessage(),
        ], 500);
    }
}
