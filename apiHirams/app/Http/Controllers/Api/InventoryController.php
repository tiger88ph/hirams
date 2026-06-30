<?php

namespace App\Http\Controllers\Api;

use App\Events\InventoryUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    /**
     * Get all inventory records with optional purchase option filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Inventory::query();

            if ($request->filled('nPurchaseOptionId')) {
                $query->where('nPurchaseOptionId', $request->nPurchaseOptionId);
            }

            $inventories = $query->orderBy('dtLog', 'desc')->get();

            return response()->json([
                'message'     => __('messages.retrieve_success', ['name' => 'Inventory']),
                'inventories' => $inventories,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Inventory');
        }
    }

    /**
     * Get a single inventory record by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $inventory = Inventory::findOrFail($id);

            return response()->json([
                'message'   => __('messages.retrieve_success', ['name' => 'Inventory']),
                'inventory' => $inventory,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Inventory']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Inventory');
        }
    }

    /**
     * Create a new inventory record
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOptionId' => 'required|integer',
                'nQuantity'          => 'required|integer',
                'dtLog'              => 'nullable|date',
            ]);

            $validated['dtLog'] = $validated['dtLog'] ?? TimeHelper::now();

            $inventory = Inventory::create($validated);
            broadcast(new InventoryUpdated('created', $inventory->nInventoryId))->toOthers();

            return response()->json([
                'message'   => __('messages.create_success', ['name' => 'Inventory']),
                'inventory' => $inventory,
            ], 201);
        } catch (QueryException $e) {
            return $this->handleDuplicateEntry($e);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Inventory');
        }
    }

    /**
     * Update an existing inventory record
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOptionId' => 'nullable|integer',
                'nQuantity'          => 'nullable|integer',
                'dtLog'              => 'nullable|date',
            ]);

            $inventory = Inventory::findOrFail($id);
            $inventory->update($validated);
            broadcast(new InventoryUpdated('updated', $inventory->nInventoryId))->toOthers();

            return response()->json([
                'message'   => __('messages.update_success', ['name' => 'Inventory']),
                'inventory' => $inventory,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Inventory']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Inventory');
        }
    }

    /**
     * Delete an inventory record
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $inventory = Inventory::findOrFail($id);
            $inventory->delete();
            broadcast(new InventoryUpdated('deleted', $inventory->nInventoryId))->toOthers();

            return response()->json([
                'message'          => __('messages.delete_success', ['name' => 'Inventory']),
                'deleted_inventory' => $inventory,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Inventory']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Inventory');
        }
    }

    /**
     * Adjust inventory quantity (increment or decrement)
     */
    public function adjustQuantity(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nQuantity' => 'required|integer',
                'operation' => 'required|string|in:increment,decrement,set',
            ]);

            $inventory = Inventory::findOrFail($id);

            switch ($validated['operation']) {
                case 'increment':
                    $inventory->nQuantity += $validated['nQuantity'];
                    break;
                case 'decrement':
                    $inventory->nQuantity = max(0, $inventory->nQuantity - $validated['nQuantity']);
                    break;
                case 'set':
                    $inventory->nQuantity = $validated['nQuantity'];
                    break;
            }

            $inventory->dtLog = TimeHelper::now();
            $inventory->save();
            $inventory->refresh();
            broadcast(new InventoryUpdated('quantity_adjusted', $inventory->nInventoryId))->toOthers();

            return response()->json([
                'message'   => __('messages.update_success', ['name' => 'Inventory Quantity']),
                'inventory' => $inventory,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Inventory']),
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Inventory Quantity');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function handleDuplicateEntry(QueryException $e): JsonResponse
    {
        if ($e->errorInfo[1] == 1062) {
            return response()->json(['message' => 'Duplicate inventory record already exists.'], 409);
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
    public function getInventory(): JsonResponse
{
    try {
        $inventories = Inventory::with([
            'purchaseOption.supplier',
            'purchaseOption.transactionItem.transaction.client',
            'purchaseOption.transactionItem.transaction.company',
        ])
            ->orderByDesc('dtLog')
            ->get()
            ->groupBy('nPurchaseOptionId')
            ->flatMap(function ($group) {
 
                // Sum ALL positive rows → total received/stocked
                $totalPositive = $group->where('nQuantity', '>', 0)->sum('nQuantity');
 
                // Sum ALL negative rows → total delivered (stored negative)
                $totalNegative = $group->where('nQuantity', '<', 0)->sum('nQuantity');
 
                $first = $group->first();
 
                $sharedMeta = [
                    'nPurchaseOptionId'   => $first->nPurchaseOptionId,
                    'dtLog'               => $first->dtLog,
                    'purchaseOption'      => $first->purchaseOption,
                    'strSupplierNickName' => $first->purchaseOption?->supplier?->strSupplierNickName ?? '—',
                    'strClientNickName'   => $first->purchaseOption?->transactionItem?->transaction?->client?->strClientNickName ?? '—',
                    'strCompanyNickName'  => $first->purchaseOption?->transactionItem?->transaction?->company?->strCompanyNickName ?? '—',
                ];
 
                $entries = [];
 
                // Net stock = received - delivered
                // e.g. rows [2, 5, 7, 3] positive + [-3, -6, -1] negative
                //   totalPositive = 17, totalNegative = -10 → stockQty = 7
                $stockQty = $totalPositive + $totalNegative;
                if ($stockQty > 0) {
                    $stockRow  = $group->firstWhere('nQuantity', '>', 0) ?? $first;
                    $entries[] = array_merge($sharedMeta, [
                        'nInventoryId' => $stockRow->nInventoryId,
                        'nQuantity'    => $stockQty,
                        'cStatus'      => 'S',
                    ]);
                }
 
                // Total delivered = abs of all negative rows summed
                if ($totalNegative < 0) {
                    $deliveredRow = $group->first(fn($r) => $r->nQuantity < 0) ?? $first;
                    $entries[]    = array_merge($sharedMeta, [
                        'nInventoryId' => $deliveredRow->nInventoryId,
                        'nQuantity'    => abs($totalNegative),
                        'cStatus'      => 'D',
                    ]);
                }
 
                return $entries;
            })
            ->values();
 
        return response()->json([
            'message'     => __('messages.retrieve_success', ['name' => 'Inventory']),
            'inventories' => $inventories,
        ]);
 
    } catch (Exception $e) {
        return $this->handleException($e, 'retrieve_failed', 'Inventory');
    }
}

    // public function getInventory(): JsonResponse
    // {
    //     try {
    //         $inventories = Inventory::with([
    //             'purchaseOption.supplier',
    //             'purchaseOption.transactionItem.transaction.client',
    //             'purchaseOption.transactionItem.transaction.company',
    //         ])
    //             ->orderByDesc('dtLog')
    //             ->get()
    //             ->groupBy('nPurchaseOptionId')
    //             ->flatMap(function ($group) {
    //                 // Sum all positive rows → received/stock
    //                 $totalPositive = $group->where('nQuantity', '>', 0)->sum('nQuantity');
    //                 // Sum all negative rows → delivered (stored as negative)
    //                 $totalNegative = $group->where('nQuantity', '<', 0)->sum('nQuantity');

    //                 // Use first item for shared relation data
    //                 $first = $group->first();

    //                 $sharedMeta = [
    //                     'nPurchaseOptionId'   => $first->nPurchaseOptionId,
    //                     'dtLog'               => $first->dtLog,
    //                     'purchaseOption'      => $first->purchaseOption,
    //                     'strSupplierNickName' => $first->purchaseOption?->supplier?->strSupplierNickName ?? '—',
    //                     'strClientNickName'   => $first->purchaseOption?->transactionItem?->transaction?->client?->strClientNickName ?? '—',
    //                     'strCompanyNickName'  => $first->purchaseOption?->transactionItem?->transaction?->company?->strCompanyNickName ?? '—',
    //                 ];

    //                 $entries = [];

    //                 // Stock entry — positive quantity remaining after subtracting delivered
    //                 // e.g. received=2, delivered=1 → stock=1
    //                 $stockQty = $totalPositive + $totalNegative; // e.g. 2 + (-1) = 1
    //                 if ($stockQty > 0) {
    //                     $stockRow = $group->firstWhere('nQuantity', '>', 0) ?? $first;
    //                     $entries[] = array_merge($sharedMeta, [
    //                         'nInventoryId' => $stockRow->nInventoryId,
    //                         'nQuantity'    => $stockQty,
    //                         'cStatus'      => 'S',
    //                     ]);
    //                 }

    //                 // Delivered entry — absolute value of negative total
    //                 // e.g. delivered=-1 → show as 1
    //                 if ($totalNegative < 0) {
    //                     $deliveredRow = $group->first(fn($r) => $r->nQuantity < 0) ?? $first;
    //                     $entries[] = array_merge($sharedMeta, [
    //                         'nInventoryId' => $deliveredRow->nInventoryId,
    //                         'nQuantity'    => abs($totalNegative),
    //                         'cStatus'      => 'D',
    //                     ]);
    //                 }

    //                 return $entries;
    //             })
    //             ->values();

    //         return response()->json([
    //             'message'     => __('messages.retrieve_success', ['name' => 'Inventory']),
    //             'inventories' => $inventories,
    //         ]);
    //     } catch (Exception $e) {
    //         return $this->handleException($e, 'retrieve_failed', 'Inventory');
    //     }
    // }
}
