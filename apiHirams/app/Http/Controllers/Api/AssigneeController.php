<?php

namespace App\Http\Controllers\Api;

use App\Events\AssigneeUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\Assignee;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AssigneeController extends Controller
{
    /**
     * Get all assignees with optional search filter and status filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Assignee::query();

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('strAssigneeName', 'LIKE', "%{$search}%")
                        ->orWhere('strAssigneeNickName', 'LIKE', "%{$search}%");
                });
            }

            if ($request->filled('cStatus')) {
                $query->where('cStatus', $request->cStatus);
            }

            $assignees = $query->orderBy('strAssigneeName')->get();

            return response()->json([
                'message'   => __('messages.retrieve_success', ['name' => 'Assignees']),
                'assignees' => $assignees,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Assignees');
        }
    }

    /**
     * Get a single assignee by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $assignee = Assignee::findOrFail($id);

            return response()->json([
                'message'  => __('messages.retrieve_success', ['name' => 'Assignee']),
                'assignee' => $assignee,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Assignee']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Assignee');
        }
    }

    /**
     * Create a new assignee
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strAssigneeName'     => 'required|string|max:150',
                'strAssigneeNickName' => 'nullable|string|max:50',
                'strAddress'          => 'nullable|string|max:255',
                'strTIN'              => 'nullable|string|max:20',
                'cStatus'             => 'required|string|max:1',
            ]);
            $assignee = Assignee::create($validated);
            broadcast(new AssigneeUpdated('created', $assignee->nAssigneeId))->toOthers();

            return response()->json([
                'message'  => __('messages.create_success', ['name' => 'Assignee']),
                'assignee' => $assignee,
            ], 201);
        } catch (QueryException $e) {
            return $this->handleDuplicateEntry($e);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Assignee');
        }
    }

    /**
     * Update an existing assignee
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strAssigneeName'     => 'required|string|max:150',
                'strAssigneeNickName' => 'nullable|string|max:50',
                'strAddress'          => 'nullable|string|max:255',
                'strTIN'              => 'nullable|string|max:20',
                'cStatus'             => 'nullable|string|max:1',
            ]);

            $assignee = Assignee::findOrFail($id);
            $assignee->update($validated);
            broadcast(new AssigneeUpdated('updated', $assignee->nAssigneeId))->toOthers();

            return response()->json([
                'message'  => __('messages.update_success', ['name' => 'Assignee']),
                'assignee' => $assignee,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Assignee']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Assignee');
        }
    }

    /**
     * Delete an assignee
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $assignee = Assignee::findOrFail($id);
            $assignee->delete();
            broadcast(new AssigneeUpdated('deleted', $assignee->nAssigneeId))->toOthers();

            return response()->json([
                'message'          => __('messages.delete_success', ['name' => 'Assignee']),
                'deleted_assignee' => $assignee,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Assignee']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Assignee');
        }
    }

    /**
     * Update assignee status only
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'cStatus' => 'required|string|max:1',
            ]);

            $assignee = Assignee::findOrFail($id);
            $assignee->update(['cStatus' => $validated['cStatus']]);
            $assignee->refresh();
            broadcast(new AssigneeUpdated('status_changed', $assignee->nAssigneeId))->toOthers();

            return response()->json([
                'message'  => __('messages.update_success', ['name' => 'Assignee Status']),
                'assignee' => $assignee,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Assignee']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Assignee Status');
        }
    }

    /**
     * Check if assignee name already exists
     */
    public function checkExist(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strAssigneeName' => 'nullable|string|max:150',
            ]);

            $exists = false;

            if (!empty($validated['strAssigneeName'])) {
                $exists = Assignee::whereRaw(
                    'BINARY strAssigneeName = ?',
                    [$validated['strAssigneeName']]
                )->exists();
            }

            return response()->json(['exists' => $exists]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Assignee existence check');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function handleDuplicateEntry(QueryException $e): JsonResponse
    {
        if ($e->errorInfo[1] == 1062) {
            return response()->json(['message' => 'Duplicate assignee record already exists.'], 409);
        }
        throw $e;
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
