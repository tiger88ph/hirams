<?php

namespace App\Http\Controllers\Api;

use App\Events\InventoryUpdated;

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

            if ($request->filled('nPurchaseItemId')) {
                $query->where('nPurchaseItemId', $request->nPurchaseItemId);
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
                'nPurchaseItemId' => 'required|integer',
                'nQuantity'          => 'required|integer',
                'dtLog'              => 'nullable|date',
                'strReceiptNumber'  => 'nullable|string',
                'cStatus' => 'required|max:1|string'
            ]);

            $validated['dtLog'] = $validated['dtLog'] ?? now();

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
                'nPurchaseItemId' => 'nullable|integer',
                'nQuantity'          => 'nullable|integer',
                'dtLog'              => 'nullable|date',
                'strReceiptNumber'  => 'nullable|string',
                'cStatus' => 'required|max:1|string'
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

            $inventory->dtLog = now();
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
            'dtDate'   => now(),
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
                'serialNumbers',
            ])
                ->orderByDesc('dtLog')
                ->get()
                ->groupBy('nPurchaseItemId')
                ->flatMap(function ($group) {

                    $pendingRows   = $group->where('cStatus', 'P');
                    $approvedGroup = $group->where('cStatus', 'A');
                    $cancelledRows = $group->where('cStatus', 'C');   // ← add this

                    // ─── PENDING ITEMS → Return DIRECTLY as "P" status ───
                    $pendingEntries = [];
                    if ($pendingRows->isNotEmpty()) {
                        foreach ($pendingRows as $pendingRow) {
                            $pendingEntries[] = [
                                'nInventoryId'       => $pendingRow->nInventoryId,
                                'nInventoryIds'       => [$pendingRow->nInventoryId],
                                'nPurchaseItemId'  => $pendingRow->nPurchaseItemId,
                                'dtLog'               => $pendingRow->dtLog,
                                'nQuantity'           => $pendingRow->nQuantity,
                                'cStatus'             => 'P', // ✅ PENDING STATUS
                                'purchaseOption'      => $pendingRow->purchaseOption,
                                'strSupplierNickName' => $pendingRow->purchaseOption?->supplier?->strSupplierNickName ?? '—',
                                'strClientNickName'   => $pendingRow->purchaseOption?->transactionItem?->transaction?->client?->strClientNickName ?? '—',
                                'strCompanyNickName'  => $pendingRow->purchaseOption?->transactionItem?->transaction?->company?->strCompanyNickName ?? '—',
                                'serialNumbers'       => $pendingRow->serialNumbers->pluck('strSerialNumber')->filter()->values(),
                            ];
                        }
                    }
                    $cancelledEntries = [];
                    foreach ($cancelledRows as $cancelledRow) {
                        $cancelledEntries[] = [
                            'nInventoryId'        => $cancelledRow->nInventoryId,
                            'nInventoryIds'       => [$cancelledRow->nInventoryId],
                            'nPurchaseItemId'   => $cancelledRow->nPurchaseItemId,
                            'dtLog'               => $cancelledRow->dtLog,
                            'nQuantity'           => $cancelledRow->nQuantity,
                            'cStatus'             => 'C',
                            'purchaseOption'      => $cancelledRow->purchaseOption,
                            'strSupplierNickName' => $cancelledRow->purchaseOption?->supplier?->strSupplierNickName ?? '—',
                            'strClientNickName'   => $cancelledRow->purchaseOption?->transactionItem?->transaction?->client?->strClientNickName ?? '—',
                            'strCompanyNickName'  => $cancelledRow->purchaseOption?->transactionItem?->transaction?->company?->strCompanyNickName ?? '—',
                            'serialNumbers'       => $cancelledRow->serialNumbers->pluck('strSerialNumber')->filter()->values(),
                        ];
                    }
                    // ─── APPROVED ITEMS → Calculate Stock(S) + Delivered(D) ───
                    $approvedEntries = [];
                    if ($approvedGroup->isNotEmpty()) {
                        $totalPositive = $approvedGroup->where('nQuantity', '>', 0)->sum('nQuantity');
                        $totalNegative = $approvedGroup->where('nQuantity', '<', 0)->sum('nQuantity');
                        $first = $approvedGroup->first();

                        $sharedMeta = [
                            'nPurchaseItemId'   => $first->nPurchaseItemId,
                            'dtLog'               => $first->dtLog,
                            'purchaseOption'      => $first->purchaseOption,
                            'strSupplierNickName' => $first->purchaseOption?->supplier?->strSupplierNickName ?? '—',
                            'strClientNickName'   => $first->purchaseOption?->transactionItem?->transaction?->client?->strClientNickName ?? '—',
                            'strCompanyNickName'  => $first->purchaseOption?->transactionItem?->transaction?->company?->strCompanyNickName ?? '—',
                        ];

                        // Stock (S) = positive balance
                        $stockQty = $totalPositive + $totalNegative;
                        if ($stockQty > 0) {
                            $positiveRows = $approvedGroup->where('nQuantity', '>', 0);
                            $stockSerials = $positiveRows->flatMap(fn($r) => $r->serialNumbers)->pluck('strSerialNumber')->filter()->values();
                            $approvedEntries[] = array_merge($sharedMeta, [
                                'nInventoryId'   => $positiveRows->first()->nInventoryId,
                                'nInventoryIds'  => $positiveRows->pluck('nInventoryId')->values(),
                                'nQuantity'     => $stockQty,
                                'cStatus'       => 'S',
                                'serialNumbers' => $stockSerials,
                            ]);
                        }

                        // Delivered (D) = absolute negative total
                        if ($totalNegative < 0) {
                            $negativeRows = $approvedGroup->where('nQuantity', '<', 0);
                            $deliveredSerials = $negativeRows->flatMap(fn($r) => $r->serialNumbers)->pluck('strSerialNumber')->filter()->values();
                            $approvedEntries[] = array_merge($sharedMeta, [
                                'nInventoryId'   => $negativeRows->first()->nInventoryId,
                                'nInventoryIds'  => $negativeRows->pluck('nInventoryId')->values(),
                                'nQuantity'     => abs($totalNegative),
                                'cStatus'       => 'D',
                                'serialNumbers' => $deliveredSerials,
                            ]);
                        }
                    }

                    // ✅ Return: PENDING + STOCK + DELIVERED + CANCELLED all SEPARATE
                    return array_merge($pendingEntries, $approvedEntries, $cancelledEntries);
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
    public function history(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
            ]);

            // AFTER
            $rows = Inventory::with('serialNumbers')
                ->where('nPurchaseItemId', $validated['nPurchaseItemId'])
                ->orderByDesc('dtLog')
                ->orderByDesc('nInventoryId')
                ->get()
                ->map(function ($row) {
                    return [
                        'nInventoryId'    => $row->nInventoryId,
                        'nQuantity'       => $row->nQuantity,
                        'dtLog'           => $row->dtLog,
                        'strReceiptNumber' => $row->strReceiptNumber,
                        'cStatus'         => $row->cStatus,
                        'serialNumbers'   => $row->serialNumbers
                            ->pluck('strSerialNumber')
                            ->filter()
                            ->values(),
                    ];
                });
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Inventory History']),
                'rows'    => $rows,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Inventory History');
        }
    }
    /**
     * Get the most recent delivered receipt number, optionally scoped to a supplier.
     * Used only to power the "suggested next receipt no." placeholder.
     */
    public function latestDeliveredReceipt(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId' => 'nullable|integer',
            ]);

            $query = Inventory::query()
                ->where('nQuantity', '<', 0)
                ->whereIn('cStatus', ['A', 'P']);  // ✅ Include A + P

            if (!empty($validated['nSupplierId'])) {
                $query->whereHas('purchaseOption', function ($q) use ($validated) {
                    $q->where('nSupplierId', $validated['nSupplierId']);
                });
            }

            $latest = $query
                ->orderByDesc('dtLog')
                ->orderByDesc('nInventoryId')
                ->first();

            return response()->json([
                'message'         => __('messages.retrieve_success', ['name' => 'Latest Receipt']),
                'strReceiptNumber' => $latest?->strReceiptNumber,
                'dtLog'            => $latest?->dtLog,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Latest Receipt');
        }
    }
}
