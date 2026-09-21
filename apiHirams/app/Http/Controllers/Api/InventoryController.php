<?php

namespace App\Http\Controllers\Api;

use App\Events\InventoryUpdated;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Jev;
use App\Models\PurchaseOptions;
use App\Models\SerialNumber;
use App\Models\SqlErrors;
use App\Services\PurchaseOrderStatusSync;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'nJEVId'          => 'nullable|integer', // ← NEW
                'nQuantity'       => 'required|integer',
                'dtLog'           => 'nullable|date',
                'strReceiptNumber' => 'nullable|string',
                'cStatus'         => 'required|max:1|string'
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
                'nJEVId'          => 'nullable|integer', // ← NEW
                'nQuantity'       => 'nullable|integer',
                'dtLog'           => 'nullable|date',
                'strReceiptNumber' => 'nullable|string',
                'cStatus'         => 'required|max:1|string'
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
                                'nInventoryId'        => $pendingRow->nInventoryId,
                                'nInventoryIds'       => [$pendingRow->nInventoryId],
                                'nPurchaseItemId'     => $pendingRow->nPurchaseItemId,
                                'nJEVId'              => $pendingRow->nJEVId, // ← NEW
                                'dtLog'               => $pendingRow->dtLog,
                                'nQuantity'           => $pendingRow->nQuantity,
                                'cStatus'             => 'P',
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
                            'nPurchaseItemId'     => $cancelledRow->nPurchaseItemId,
                            'nJEVId'              => $cancelledRow->nJEVId, // ← NEW
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
                                'nJEVId'         => $positiveRows->first()->nJEVId, // ← NEW
                                'nQuantity'      => $stockQty,
                                'cStatus'        => 'S',
                                'serialNumbers'  => $stockSerials,
                            ]);
                        }

                        // Delivered (D) = absolute negative total
                        if ($totalNegative < 0) {
                            $negativeRows = $approvedGroup->where('nQuantity', '<', 0);
                            $deliveredSerials = $negativeRows->flatMap(fn($r) => $r->serialNumbers)->pluck('strSerialNumber')->filter()->values();
                            $approvedEntries[] = array_merge($sharedMeta, [
                                'nInventoryId'   => $negativeRows->first()->nInventoryId,
                                'nInventoryIds'  => $negativeRows->pluck('nInventoryId')->values(),
                                'nJEVId'         => $negativeRows->first()->nJEVId, // ← NEW
                                'nQuantity'      => abs($totalNegative),
                                'cStatus'        => 'D',
                                'serialNumbers'  => $deliveredSerials,
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
                        'nInventoryId'      => $row->nInventoryId,
                        'nQuantity'         => $row->nQuantity,
                        'nJEVId'            => $row->nJEVId, // ← NEW
                        'dtLog'             => $row->dtLog,
                        'strReceiptNumber'  => $row->strReceiptNumber,
                        'cStatus'           => $row->cStatus,
                        'serialNumbers'     => $row->serialNumbers
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

    /**
     * Create a JEV for all pending (cStatus = 'P') received inventory rows
     * belonging to a purchase item, and stamp its nJEVId onto those rows.
     */
    public function createJevForPending(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
            ]);

            $result = DB::transaction(function () use ($validated) {
                // Only rows that are: this item, pending, RECEIVED (positive qty),
                // and not already linked to a JEV
                $pendingRows = Inventory::where('nPurchaseItemId', $validated['nPurchaseItemId'])
                    ->where('cStatus', 'P')
                    ->where('nQuantity', '>', 0)
                    ->whereNull('nJEVId')
                    ->get();

                if ($pendingRows->isEmpty()) {
                    throw new Exception('No pending received batches to attach to a JEV.');
                }

                $jev = Jev::create([
                    'cJEVLinkType' => 'R', // ← Received
                    'dtOccur'      => now(),
                    'cStatus'      => 'P',
                ]);

                Inventory::whereIn('nInventoryId', $pendingRows->pluck('nInventoryId'))
                    ->update(['nJEVId' => $jev->nJEVId]);

                return ['jev' => $jev, 'updatedIds' => $pendingRows->pluck('nInventoryId')];
            });

            broadcast(new InventoryUpdated('jev_created', $validated['nPurchaseItemId']))->toOthers();

            return response()->json([
                'message'    => 'JEV created and linked to pending inventory.',
                'jev'        => $result['jev'],
                'updatedIds' => $result['updatedIds'],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'JEV');
        }
    }
    public function createJevForPendingDelivered(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
            ]);

            $result = DB::transaction(function () use ($validated) {
                $pendingRows = Inventory::where('nPurchaseItemId', $validated['nPurchaseItemId'])
                    ->where('cStatus', 'P')
                    ->where('nQuantity', '<', 0)   // ← delivered rows are negative
                    ->whereNull('nJEVId')
                    ->get();

                if ($pendingRows->isEmpty()) {
                    throw new Exception('No pending delivered batches to attach to a JEV.');
                }

                $jev = Jev::create([
                    'cJEVLinkType' => 'D', // ← Delivered
                    'dtOccur'      => now(),
                    'cStatus'      => 'P',
                ]);

                Inventory::whereIn('nInventoryId', $pendingRows->pluck('nInventoryId'))
                    ->update(['nJEVId' => $jev->nJEVId]);

                return ['jev' => $jev, 'updatedIds' => $pendingRows->pluck('nInventoryId')];
            });

            broadcast(new InventoryUpdated('jev_created', $validated['nPurchaseItemId']))->toOthers();

            return response()->json([
                'message'    => 'JEV created and linked to pending delivered inventory.',
                'jev'        => $result['jev'],
                'updatedIds' => $result['updatedIds'],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'JEV');
        }
    }
    public function bulkReceiveDeliver(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'mode'                    => 'required|in:receive,deliver',
                'nPurchaseOrderId'        => 'nullable|integer',
                'nReceivedStatus'         => 'required_with:nPurchaseOrderId|string',
                'nDeliveredStatus'        => 'required_with:nPurchaseOrderId|string',
                'nPaidStatus'             => 'required_with:nPurchaseOrderId|string',
                'items'                   => 'required|array|min:1',
                'items.*.nPurchaseItemId' => 'required|integer',
                'items.*.nQuantity'       => 'required|integer|min:1',   // always positive; sign is set by mode
                'items.*.strReceiptNumber' => 'required|string',
                'items.*.serials'         => 'nullable|array',
                'items.*.serials.*'       => 'string|max:50',
            ]);

            $sign    = $v['mode'] === 'receive' ? 1 : -1;
            $itemIds = collect($v['items'])->pluck('nPurchaseItemId')->unique()->values();

            $createdIds = DB::transaction(function () use ($v, $sign, $itemIds) {
                // One query for current totals of every affected item
                $totals = Inventory::whereIn('nPurchaseItemId', $itemIds)
                    ->whereIn('cStatus', ['A', 'P'])
                    ->selectRaw('nPurchaseItemId,
                    SUM(CASE WHEN nQuantity > 0 THEN nQuantity ELSE 0 END) AS received,
                    ABS(SUM(CASE WHEN nQuantity < 0 THEN nQuantity ELSE 0 END)) AS delivered')
                    ->groupBy('nPurchaseItemId')
                    ->lockForUpdate()
                    ->get()->keyBy('nPurchaseItemId');

                // Approved-only received, needed for the deliver guard
                $approvedReceived = Inventory::whereIn('nPurchaseItemId', $itemIds)
                    ->where('cStatus', 'A')->where('nQuantity', '>', 0)
                    ->selectRaw('nPurchaseItemId, SUM(nQuantity) AS q')
                    ->groupBy('nPurchaseItemId')->pluck('q', 'nPurchaseItemId');

                $ordered = PurchaseOptions::whereIn('nPurchaseItemId', $itemIds)
                    ->pluck('nQuantity', 'nPurchaseItemId');

                $now = now();
                $ids = [];
                $snRows = [];

                foreach ($v['items'] as $it) {
                    $pid = $it['nPurchaseItemId'];
                    $qty = (int) $it['nQuantity'];
                    $t   = $totals->get($pid);
                    $rec = (int) ($t->received ?? 0);
                    $del = (int) ($t->delivered ?? 0);

                    if ($sign === 1) {
                        if ($rec + $qty > (int) ($ordered[$pid] ?? 0)) {
                            throw ValidationException::withMessages(["items" => "Item {$pid}: receiving {$qty} exceeds the ordered quantity."]);
                        }
                    } else {
                        $free = (int) ($approvedReceived[$pid] ?? 0) - $del;
                        if ($qty > $free) {
                            throw ValidationException::withMessages(["items" => "Item {$pid}: only {$free} left to deliver."]);
                        }
                    }

                    $inv = Inventory::create([
                        'nPurchaseItemId'  => $pid,
                        'nQuantity'        => $sign * $qty,
                        'strReceiptNumber' => trim($it['strReceiptNumber']),
                        'cStatus'          => 'P',
                        'dtLog'            => $now,
                    ]);
                    $ids[] = $inv->nInventoryId;

                    foreach ($it['serials'] ?? [] as $sn) {
                        $snRows[] = [
                            'nInventoryId'    => $inv->nInventoryId,
                            'strSerialNumber' => $sn,
                            'dtLog'           => $now,
                        ];
                    }
                }

                // One INSERT for all serial numbers
                foreach (array_chunk($snRows, 500) as $chunk) {
                    SerialNumber::insert($chunk);
                }

                return $ids;
            });

            if (!empty($v['nPurchaseOrderId'])) {
                app(PurchaseOrderStatusSync::class)->sync(
                    $v['nPurchaseOrderId'],
                    $v['nReceivedStatus'],
                    $v['nDeliveredStatus'],
                    $v['nPaidStatus']
                );
            }

            // ONE broadcast for the whole batch
            broadcast(new InventoryUpdated('bulk_' . $v['mode'], $createdIds[0]))->toOthers();
            if (!empty($v['nPurchaseOrderId'])) {
                broadcast(new \App\Events\PurchaseOrderUpdated('status_synced', $v['nPurchaseOrderId']))->toOthers();
            }

            return response()->json([
                'message'    => 'Inventory recorded.',
                'created'    => count($createdIds),
                'inventoryIds' => $createdIds,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Inventory');
        }
    }

    /** History for many items in one query (replaces N getHistory calls) */
    public function historyBulk(Request $request): JsonResponse
    {
        $v = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $rows = Inventory::with('serialNumbers')
            ->whereIn('nPurchaseItemId', $v['ids'])
            ->orderByDesc('dtLog')->orderByDesc('nInventoryId')
            ->get()
            ->groupBy('nPurchaseItemId')
            ->map(fn($g) => $g->map(fn($r) => [
                'nInventoryId'     => $r->nInventoryId,
                'nQuantity'        => $r->nQuantity,
                'nJEVId'           => $r->nJEVId,
                'dtLog'            => $r->dtLog,
                'strReceiptNumber' => $r->strReceiptNumber,
                'cStatus'          => $r->cStatus,
                'serialNumbers'    => $r->serialNumbers->pluck('strSerialNumber')->filter()->values(),
            ])->values());

        return response()->json(['rows' => $rows]);
    }

    /** Flip many inventory rows at once (JEV finalize / undo) */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $v = $request->validate([
            'ids'     => 'required|array|min:1',
            'ids.*'   => 'integer',
            'cStatus' => 'required|string|max:1',
        ]);

        Inventory::whereIn('nInventoryId', $v['ids'])->update(['cStatus' => $v['cStatus']]);
        broadcast(new InventoryUpdated('bulk_status', $v['ids'][0]))->toOthers();

        return response()->json(['message' => 'Updated.', 'updated' => count($v['ids'])]);
    }
    public function bulkCreateJev(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'type'              => 'required|in:received,delivered',
                'nPurchaseItemIds'  => 'required|array|min:1',
                'nPurchaseItemIds.*' => 'integer',
            ]);

            $isReceived = $v['type'] === 'received';

            $created = DB::transaction(function () use ($v, $isReceived) {
                // One query for every pending, unlinked row across all items
                $rows = Inventory::whereIn('nPurchaseItemId', $v['nPurchaseItemIds'])
                    ->where('cStatus', 'P')
                    ->where('nQuantity', $isReceived ? '>' : '<', 0)
                    ->whereNull('nJEVId')
                    ->lockForUpdate()
                    ->get(['nInventoryId', 'nPurchaseItemId'])
                    ->groupBy('nPurchaseItemId');

                if ($rows->isEmpty()) {
                    throw new Exception('No pending batches to attach to a JEV.');
                }

                $now = now();
                $result = [];

                foreach ($rows as $purchaseItemId => $group) {
                    $jev = Jev::create([
                        'cJEVLinkType' => $isReceived ? 'R' : 'D',
                        'dtOccur'      => $now,
                        'cStatus'      => 'P',
                    ]);

                    Inventory::whereIn('nInventoryId', $group->pluck('nInventoryId'))
                        ->update(['nJEVId' => $jev->nJEVId]);

                    $result[] = [
                        'nPurchaseItemId' => $purchaseItemId,
                        'nJEVId'          => $jev->nJEVId,
                        'updatedIds'      => $group->pluck('nInventoryId')->values(),
                    ];
                }

                return $result;
            });

            broadcast(new InventoryUpdated('jev_created', $created[0]['nPurchaseItemId']))->toOthers();

            return response()->json([
                'message' => 'JEVs created and linked.',
                'created' => $created,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'JEV');
        }
    }
}
