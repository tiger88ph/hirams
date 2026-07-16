<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderUpdated;
use App\Events\VoucherUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\PurchaseItemHistory;
use App\Models\PurchaseOrder;
use App\Models\SerialNumber;
use App\Models\VoucherSupplier;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{

    public function store(Request $request): JsonResponse
    {
        try {
            $purchaseOrder = DB::transaction(function () {
                $year   = now()->format('Y');        // ✅ "2026" — capital Y, not 'yyyy'
                $prefix = $year . '-';               // "2026-"

                $last = PurchaseOrder::where('strPurchaseOrderNo', 'LIKE', $prefix . '%')
                    ->lockForUpdate()
                    ->orderBy('strPurchaseOrderNo', 'desc')
                    ->first();

                $nextSeq  = $last
                    ? (int) substr($last->strPurchaseOrderNo, strlen($prefix)) + 1  // strip "2026-", cast, +1
                    : 1;

                $sequence = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);  // ✅ "0001" — pad char is '0', not '-0'

                return PurchaseOrder::create([
                    'strPurchaseOrderNo' => $prefix . $sequence,       // "2026-0001"
                ]);
            });
            broadcast(new PurchaseOrderUpdated(
                action: 'created',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
            ));

            return response()->json([
                'message'       => 'Purchase Order created successfully.',
                'purchaseOrder' => $purchaseOrder,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create Purchase Order.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    public function getAllPurchaseOrders(): JsonResponse
    {
        try {
            $purchaseOrders = PurchaseOrder::with([
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction.user',
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction.company',
                'purchaseOrderOptions.purchaseOption.supplier',
                'purchaseOrderOptions.purchaseOption.supplierContact',
                'purchaseOrderOptions.latestHistory',
            ])->get();

            $purchaseOrders->each(function ($po) {
                $po->purchaseOrderOptions->each(function ($poOption) {

                    $nPurchaseOptionId = $poOption->purchaseOption?->nPurchaseOptionId;

                    // ── All positive rows (received) — ACTIVE only ─────────────
                    // cStatus = 'A' rows count toward received qty/%/stamp;
                    // 'C' (cancelled) rows are excluded entirely.
                    $receivedRows = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
                        ->where('nQuantity', '>', 0)
                        ->where('cStatus', 'A')
                        ->orderBy('dtLog', 'asc')   // oldest first → anchor row is [0]
                        ->get();

                    $totalReceived   = $receivedRows->sum('nQuantity');
                    $anchorReceived  = $receivedRows->first(); // oldest row for SN attachment

                    // ── All negative rows (delivered) — ACTIVE only ────────────
                    $deliveredRows = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
                        ->where('nQuantity', '<', 0)
                        ->where('cStatus', 'A')
                        ->orderBy('dtLog', 'asc')
                        ->get();

                    $totalDelivered  = $deliveredRows->sum('nQuantity'); // negative total
                    $anchorDelivered = $deliveredRows->first();
                    // ── Set attributes ────────────────────────────────────────
                    $poOption->purchaseOption->setAttribute('nInventoryQty',  $totalReceived);
                    $poOption->purchaseOption->setAttribute('nInventoryId',   $anchorReceived?->nInventoryId);

                    $poOption->purchaseOption->setAttribute('nDeliveredQty',            abs($totalDelivered));
                    $poOption->purchaseOption->setAttribute('nDeliveredInventoryId',    $anchorDelivered?->nInventoryId);

                    // ── Serial numbers — union across all rows of each sign ───
                    $receivedInventoryIds = $receivedRows->pluck('nInventoryId')->filter()->values();
                    $receivedSerials = $receivedInventoryIds->isNotEmpty()
                        ? SerialNumber::whereIn('nInventoryId', $receivedInventoryIds)
                        ->orderBy('dtLog', 'asc')
                        ->pluck('strSerialNumber')
                        ->toArray()
                        : [];

                    $deliveredInventoryIds = $deliveredRows->pluck('nInventoryId')->filter()->values();
                    $deliveredSerials = $deliveredInventoryIds->isNotEmpty()
                        ? SerialNumber::whereIn('nInventoryId', $deliveredInventoryIds)
                        ->orderBy('dtLog', 'asc')
                        ->pluck('strSerialNumber')
                        ->toArray()
                        : [];

                    $poOption->purchaseOption->setAttribute('receivedSerialNumbers',  $receivedSerials);
                    $poOption->purchaseOption->setAttribute('deliveredSerialNumbers', $deliveredSerials);
                });
            });

            return response()->json([
                'message'        => 'Purchase orders retrieved successfully.',
                'purchaseOrders' => $purchaseOrders,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase orders.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // public function getAllPurchaseOrders(): JsonResponse
    // {
    //     try {
    //         $purchaseOrders = PurchaseOrder::with([
    //             'purchaseOrderOptions.purchaseOption.transactionItem.transaction.user',
    //             'purchaseOrderOptions.purchaseOption.transactionItem.transaction.company',
    //             'purchaseOrderOptions.purchaseOption.supplier',
    //             'purchaseOrderOptions.purchaseOption.supplierContact',
    //             'purchaseOrderOptions.latestHistory',
    //         ])->get();

    //         // Attach summed inventory qty per purchase option
    //         $purchaseOrders->each(function ($po) {
    //             $po->purchaseOrderOptions->each(function ($poOption) {
    //                 $nPurchaseOptionId = $poOption->purchaseOption?->nPurchaseOptionId;
    //                 $received = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
    //                     ->where('nQuantity', '>', 0)
    //                     ->orderBy('dtLog', 'desc')
    //                     ->first();

    //                 $delivered = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
    //                     ->where('nQuantity', '<', 0)
    //                     ->orderBy('dtLog', 'desc')
    //                     ->first();

    //                 // With:
    //                 $poOption->purchaseOption->setAttribute('nInventoryQty', $received?->nQuantity ?? 0);
    //                 $poOption->purchaseOption->setAttribute('nInventoryId', $received?->nInventoryId ?? null);
    //                 $poOption->purchaseOption->setAttribute('nDeliveredQty', abs($delivered?->nQuantity ?? 0));
    //                 $poOption->purchaseOption->setAttribute('nDeliveredInventoryId', $delivered?->nInventoryId ?? null);

    //                 // With:
    //                 // Received SNs = SNs under the positive inventory record
    //                 $receivedSerials = $received
    //                     ? SerialNumber::where('nInventoryId', $received->nInventoryId)
    //                     ->orderBy('dtLog', 'asc')
    //                     ->pluck('strSerialNumber')
    //                     ->toArray()
    //                     : [];

    //                 // Delivered SNs = SNs under the negative inventory record
    //                 // These are SNs that appear in delivered inventory (count = 2 total across both)
    //                 $deliveredSerials = $delivered
    //                     ? SerialNumber::where('nInventoryId', $delivered->nInventoryId)
    //                     ->orderBy('dtLog', 'asc')
    //                     ->pluck('strSerialNumber')
    //                     ->toArray()
    //                     : [];

    //                 $poOption->purchaseOption->setAttribute('receivedSerialNumbers', $receivedSerials);
    //                 $poOption->purchaseOption->setAttribute('deliveredSerialNumbers', $deliveredSerials);
    //             });
    //         });

    //         return response()->json([
    //             'message'        => 'Purchase orders retrieved successfully.',
    //             'purchaseOrders' => $purchaseOrders,
    //         ]);
    //     } catch (Exception $e) {
    //         return response()->json([
    //             'message' => 'Failed to retrieve purchase orders.',
    //             'error'   => $e->getMessage(),
    //         ], 500);
    //     }
    // }
    public function updateCartStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId' => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
                'cStatus'          => 'required|string|max:1',
                'nUserId'          => 'nullable|integer',
            ]);

            $voucherStatusKeys     = array_keys(config('mappings.voucher_status'));
            $forPurchaseStatusKeys = array_keys(config('mappings.for_purchase_status'));
            $cartStatusKeys        = array_keys(config('mappings.cart_status'));

            $openStatusKey       = $voucherStatusKeys[0];
            $closedStatusKey     = $voucherStatusKeys[1];
            $cancelledVoucherKey = $voucherStatusKeys[2];
            $cancelCartKey       = $cartStatusKeys[2];
            $cancelPoKey         = $forPurchaseStatusKeys[0];

            $purchaseOrder = PurchaseOrder::with('purchaseOrderOptions.purchaseOption')
                ->findOrFail($validated['nPurchaseOrderId']);

            $purchaseOrder->cStatus = $validated['cStatus'];
            $purchaseOrder->save();

            broadcast(new PurchaseOrderUpdated(
                action: 'status_updated',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
                newStatus: $validated['cStatus'],
            ));

            if ($validated['cStatus'] === $cancelCartKey) {
                $now = TimeHelper::now();

                foreach ($purchaseOrder->purchaseOrderOptions as $poOption) {
                    PurchaseItemHistory::create([
                        'nPurchaseOrder_OptionId' => $poOption->nPurchaseOrder_OptionId,
                        'nStatus'                 => $cancelPoKey,
                        'nUserId'                 => $validated['nUserId'] ?? null,
                        'dtOccur'                 => $now,
                    ]);

                    if ($poOption->purchaseOption) {
                        $poOption->purchaseOption->bPurchaseIncluded = 0;
                        $poOption->purchaseOption->save();
                    }
                }

                // Cancel linked vouchers using mapping keys
                $linkedVoucherSuppliers = VoucherSupplier::with('voucher')
                    ->where('nPurchaseOrderId', $validated['nPurchaseOrderId'])
                    ->get();

                foreach ($linkedVoucherSuppliers as $voucherSupplier) {
                    $voucher = $voucherSupplier->voucher;

                    if (
                        $voucher &&
                        in_array($voucher->cStatus, [$openStatusKey, $closedStatusKey])
                    ) {
                        $voucher->cStatus = $cancelledVoucherKey;
                        $voucher->save();

                        broadcast(new VoucherUpdated(
                            'status_changed',
                            $voucher->nVoucherId
                        ));
                    }
                }
            }

            return response()->json([
                'message'       => 'Cart status updated successfully.',
                'purchaseOrder' => $purchaseOrder,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to update cart status.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    public function updateCartStatusBulk(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderIds'   => 'required|array|min:1',
                'nPurchaseOrderIds.*' => 'integer|exists:tblpurchaseorder,nPurchaseOrderId',
                'nStatus'             => 'required|string',
                'nUserId'             => 'nullable|integer',
            ]);

            $purchaseOrders = PurchaseOrder::with('purchaseOrderOptions')
                ->whereIn('nPurchaseOrderId', $validated['nPurchaseOrderIds'])
                ->get();

            $now = TimeHelper::now();

            foreach ($purchaseOrders as $purchaseOrder) {
                foreach ($purchaseOrder->purchaseOrderOptions as $poOption) {
                    PurchaseItemHistory::create([
                        'nPurchaseOrder_OptionId' => $poOption->nPurchaseOrder_OptionId,
                        'nStatus'                 => $validated['nStatus'],
                        'nUserId'                 => $validated['nUserId'] ?? null,
                        'dtOccur'                 => $now,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Purchase item histories updated successfully.',
                'updated' => $purchaseOrders->pluck('nPurchaseOrderId'),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to update purchase item histories.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    public function proceedToPayment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId' => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
                'strShippingDetails'  => 'required|string',
                'cPaymentTerms'    => 'required|string|max:1',
                'nUserId'          => 'required|integer',
                'nStatus'          => 'required|string',
            ]);

            $purchaseOrder = PurchaseOrder::with('purchaseOrderOptions')
                ->findOrFail($validated['nPurchaseOrderId']);

            $purchaseOrder->strShippingDetails    = $validated['strShippingDetails'];
            $purchaseOrder->cPaymentTerms      = $validated['cPaymentTerms'];
            $purchaseOrder->dtProceedToPayment = TimeHelper::now();
            $purchaseOrder->save();
            broadcast(new PurchaseOrderUpdated(
                action: 'payment_updated',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
            ));
            // Insert a history row for every option linked to this P
            $now = TimeHelper::now();
            foreach ($purchaseOrder->purchaseOrderOptions as $option) {
                PurchaseItemHistory::create([
                    'nPurchaseOrder_OptionId' => $option->nPurchaseOrder_OptionId,
                    'nStatus'                 => $validated['nStatus'],
                    'nUserId'                 => $validated['nUserId'],
                    'dtOccur'                 => $now,
                ]);
            }

            return response()->json([
                'message'       => 'Purchase order proceeded to payment successfully.',
                'purchaseOrder' => $purchaseOrder,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to proceed to payment.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    public function getBySupplier(Request $request): JsonResponse
    {
        try {
            $supplierId = $request->query('nSupplierId');

            if (!$supplierId) {
                return response()->json([
                    'message' => 'Supplier ID is required.',
                ], 400);
            }

            $purchaseOrders = PurchaseOrder::with([
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction',
            ])
                ->where(function ($query) use ($supplierId) {
                    // PO where the supplier matches any of its purchase_options
                    $query->whereHas('purchaseOrderOptions.purchaseOption', function ($q) use ($supplierId) {
                        $q->where('nSupplierId', $supplierId);
                    });
                })
                ->orderByDesc('nPurchaseOrderId')
                ->get();

            return response()->json([
                'message' => 'Purchase orders retrieved successfully.',
                'data' => $purchaseOrders,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase orders.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function syncPurchaseOrderStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId'  => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
                'nPurchaseOptionId' => 'required|integer',   // ← add
                'nUserId'           => 'nullable|integer',
                'nReceivedStatus'   => 'required|string',
                'nDeliveredStatus'  => 'required|string',
                'nPaidStatus'       => 'required|string',
            ]);

            $purchaseOrder = PurchaseOrder::with([
                'purchaseOrderOptions' => function ($q) use ($validated) {
                    // ← only load the one option that changed
                    $q->where('nPurchaseOrder_OptionId', function ($sub) use ($validated) {
                        $sub->select('nPurchaseOrder_OptionId')
                            ->from('tblpurchaseorder_option')
                            ->where('nPurchaseOptionId', $validated['nPurchaseOptionId']);
                    });
                },
                'purchaseOrderOptions.purchaseOption',
            ])->findOrFail($validated['nPurchaseOrderId']);

            $options = $purchaseOrder->purchaseOrderOptions;
            $now     = TimeHelper::now();

           foreach ($options as $poOption) {
                $po = $poOption->purchaseOption;
                if (!$po) continue;

                $orderedQty = (int) $po->nQuantity;

                // Sum ACTIVE rows only — cancelled ('C') rows don't count,
                // and we sum all batches instead of trusting just the latest row.
                $receivedQty = (int) Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
                    ->where('nQuantity', '>', 0)
                    ->where('cStatus', 'A')
                    ->sum('nQuantity');

                $deliveredQty = (int) abs(Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
                    ->where('nQuantity', '<', 0)
                    ->where('cStatus', 'A')
                    ->sum('nQuantity'));

                if ($deliveredQty >= $orderedQty) {
                    $targetStatus = $validated['nDeliveredStatus'];
                } elseif ($receivedQty >= $orderedQty) {
                    $targetStatus = $validated['nReceivedStatus'];
                } else {
                    $targetStatus = $validated['nPaidStatus'];
                }
                PurchaseItemHistory::create([
                    'nPurchaseOrder_OptionId' => $poOption->nPurchaseOrder_OptionId,
                    'nStatus'                 => $targetStatus,
                    'nUserId'                 => $validated['nUserId'] ?? null,
                    'dtOccur'                 => $now,
                ]);
            }

            broadcast(new PurchaseOrderUpdated(
                action: 'status_synced',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
            ));

            return response()->json([
                'message' => 'Purchase order status synced per item.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to sync purchase order status.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    //     public function syncPurchaseOrderStatus(Request $request): JsonResponse
    // {
    //     try {
    //         $validated = $request->validate([
    //             'nPurchaseOrderId' => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
    //             'nUserId'          => 'nullable|integer',
    //             'nReceivedStatus'  => 'required|string',
    //             'nDeliveredStatus' => 'required|string',
    //             'nPaidStatus'      => 'required|string',
    //         ]);

    //         $purchaseOrder = PurchaseOrder::with('purchaseOrderOptions.purchaseOption')
    //             ->findOrFail($validated['nPurchaseOrderId']);

    //         $options = $purchaseOrder->purchaseOrderOptions;
    //         $now     = TimeHelper::now();

    //         $allReceived  = true;
    //         $allDelivered = true;

    //         foreach ($options as $poOption) {
    //             $po = $poOption->purchaseOption;
    //             if (!$po) {
    //                 $allReceived  = false;
    //                 $allDelivered = false;
    //                 continue;
    //             }

    //             $orderedQty = (int) $po->nQuantity;

    //             $receivedQty = (int) (Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
    //                 ->where('nQuantity', '>', 0)
    //                 ->orderBy('dtLog', 'desc')
    //                 ->value('nQuantity') ?? 0);

    //             $deliveredQty = (int) abs(Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
    //                 ->where('nQuantity', '<', 0)
    //                 ->orderBy('dtLog', 'desc')
    //                 ->value('nQuantity') ?? 0);

    //             if ($receivedQty < $orderedQty)  $allReceived  = false;
    //             if ($deliveredQty < $orderedQty) $allDelivered = false;
    //         }

    //         // Determine the target status
    //         // allDelivered implies allReceived, so check delivered first
    //         $targetStatus = null;
    //         if ($allDelivered) {
    //             $targetStatus = $validated['nDeliveredStatus'];
    //         } elseif ($allReceived) {
    //             $targetStatus = $validated['nReceivedStatus'];
    //         } else {
    //             // Something was reduced — fall back to paidKey
    //             $targetStatus = $validated['nPaidStatus'];
    //         }

    //         // Insert a new history row for every option with the resolved status
    //         foreach ($options as $poOption) {
    //             PurchaseItemHistory::create([
    //                 'nPurchaseOrder_OptionId' => $poOption->nPurchaseOrder_OptionId,
    //                 'nStatus'                 => $targetStatus,
    //                 'nUserId'                 => $validated['nUserId'] ?? null,
    //                 'dtOccur'                 => $now,
    //             ]);
    //         }

    //         broadcast(new PurchaseOrderUpdated(
    //             action: 'status_synced',
    //             purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
    //         ));

    //         return response()->json([
    //             'message'       => 'Purchase order status synced.',
    //             'targetStatus'  => $targetStatus,
    //             'allReceived'   => $allReceived,
    //             'allDelivered'  => $allDelivered,
    //         ]);
    //     } catch (ValidationException $e) {
    //         return response()->json([
    //             'message' => 'Validation failed.',
    //             'errors'  => $e->errors(),
    //         ], 422);
    //     } catch (Exception $e) {
    //         return response()->json([
    //             'message' => 'Failed to sync purchase order status.',
    //             'error'   => $e->getMessage(),
    //         ], 500);
    //     }
    // }
}
