<?php

namespace App\Http\Controllers\Api;

use App\Events\SerialNumberUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\SerialNumber;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SerialNumberController extends Controller
{
    /**
     * Get all serial numbers with optional inventory filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SerialNumber::query();

            if ($request->filled('nInventoryId')) {
                $query->where('nInventoryId', $request->nInventoryId);
            }

            if ($request->filled('search')) {
                $query->where('strSerialNumber', 'LIKE', "%{$request->search}%");
            }

            $serialNumbers = $query->orderBy('dtLog', 'desc')->get();

            return response()->json([
                'message'        => __('messages.retrieve_success', ['name' => 'Serial Numbers']),
                'serial_numbers' => $serialNumbers,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Serial Numbers');
        }
    }

    /**
     * Get a single serial number by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $serialNumber = SerialNumber::findOrFail($id);

            return response()->json([
                'message'       => __('messages.retrieve_success', ['name' => 'Serial Number']),
                'serial_number' => $serialNumber,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Serial Number']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Serial Number');
        }
    }

    /**
     * Create a new serial number
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nInventoryId'  => 'required|integer',
                'strSerialNumber' => 'required|string|max:50',
                'dtLog'         => 'nullable|date',
            ]);

            $validated['dtLog'] = $validated['dtLog'] ?? TimeHelper::now();

            $serialNumber = SerialNumber::create($validated);
            broadcast(new SerialNumberUpdated('created', $serialNumber->nSNId))->toOthers();

            return response()->json([
                'message'       => __('messages.create_success', ['name' => 'Serial Number']),
                'serial_number' => $serialNumber,
            ], 201);
        } catch (QueryException $e) {
            return $this->handleDuplicateEntry($e);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Serial Number');
        }
    }

    /**
     * Update an existing serial number
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nInventoryId'  => 'nullable|integer',
                'strSerialNumber' => 'required|string|max:50',
                'dtLog'         => 'nullable|date',
            ]);

            $serialNumber = SerialNumber::findOrFail($id);
            $serialNumber->update($validated);
            broadcast(new SerialNumberUpdated('updated', $serialNumber->nSNId))->toOthers();

            return response()->json([
                'message'       => __('messages.update_success', ['name' => 'Serial Number']),
                'serial_number' => $serialNumber,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Serial Number']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Serial Number');
        }
    }

    /**
     * Delete a serial number
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $serialNumber = SerialNumber::findOrFail($id);
            $serialNumber->delete();
            broadcast(new SerialNumberUpdated('deleted', $serialNumber->nSNId))->toOthers();

            return response()->json([
                'message'               => __('messages.delete_success', ['name' => 'Serial Number']),
                'deleted_serial_number' => $serialNumber,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Serial Number']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Serial Number');
        }
    }

    /**
     * Get all serial numbers belonging to a specific inventory record
     */
    public function byInventory(int $inventoryId): JsonResponse
    {
        try {
            $serialNumbers = SerialNumber::where('nInventoryId', $inventoryId)
                ->orderBy('strSerialNumber')
                ->get();

            return response()->json([
                'message'        => __('messages.retrieve_success', ['name' => 'Serial Numbers']),
                'serial_numbers' => $serialNumbers,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Serial Numbers');
        }
    }

    /**
     * Check if a serial number already exists
     */
    public function checkExist(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                // With:
                'strSerialNumber' => 'nullable|string|max:50',
            ]);

            $exists = false;

            if (!empty($validated['strSerialNumber'])) {
                $exists = SerialNumber::where('strSerialNumber', $validated['strSerialNumber'])->exists();
            }

            return response()->json(['exists' => $exists]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Serial Number existence check');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function handleDuplicateEntry(QueryException $e): JsonResponse
    {
        if ($e->errorInfo[1] == 1062) {
            return response()->json(['message' => 'Duplicate serial number record already exists.'], 409);
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
