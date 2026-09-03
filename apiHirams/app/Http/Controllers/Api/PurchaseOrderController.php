<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderUpdated;
use App\Events\VoucherUpdated;

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
                $prefix = 'PO' . $year . '-';               // "PO2026-"

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
                    // ── All positive rows (received) — ACTIVE + PENDING ─────────────
                    $receivedRows = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
                        ->where('nQuantity', '>', 0)
                        ->whereIn('cStatus', ['A', 'P'])  // ✅ Include A OR P — not locked to A
                        ->orderBy('dtLog', 'asc')
                        ->get();


                    $totalReceived   = $receivedRows->sum('nQuantity');
                    $anchorReceived  = $receivedRows->first(); // oldest row for SN attachment

                    // ── All negative rows (delivered) — ACTIVE + PENDING ────────────
                    $deliveredRows = Inventory::where('nPurchaseOptionId', $nPurchaseOptionId)
                        ->where('nQuantity', '<', 0)
                        ->whereIn('cStatus', ['A', 'P'])  // ✅ Include A OR P
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
                $now = now();

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

            $now = now();

            DB::transaction(function () use ($purchaseOrders, $validated, $now) {
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
            });

            // ✅ broadcast so other screens actually refresh
            foreach ($purchaseOrders as $purchaseOrder) {
                broadcast(new PurchaseOrderUpdated(
                    action: 'status_synced',
                    purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
                ));
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
    public function proceedToPODetails(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId'    => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
                'strShippingDetails'  => 'required|string',
                'cPaymentTerms'       => 'required|string|max:1',
            ]);

            $purchaseOrder = PurchaseOrder::findOrFail($validated['nPurchaseOrderId']);

            $purchaseOrder->strShippingDetails  = $validated['strShippingDetails'];
            $purchaseOrder->cPaymentTerms       = $validated['cPaymentTerms'];
            $purchaseOrder->dtProceedToPayment  = now();
            $purchaseOrder->save();

            broadcast(new PurchaseOrderUpdated(
                action: 'payment_updated',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
            ));

            return response()->json([
                'message'       => 'Purchase order details updated successfully.',
                'purchaseOrder' => $purchaseOrder,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to update purchase order details.',
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
            $now     = now();

            foreach ($options as $poOption) {
                $po = $poOption->purchaseOption;
                if (!$po) continue;

                $orderedQty = (int) $po->nQuantity;

                // Sum ACTIVE rows only — cancelled ('C') rows don't count,
                // and we sum all batches instead of trusting just the latest row.
                $receivedQty = (int) Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
                    ->where('nQuantity', '>', 0)
                    ->whereIn('cStatus', ['A', 'P'])  // ✅ Include A + P
                    ->sum('nQuantity');

                $deliveredQty = (int) abs(Inventory::where('nPurchaseOptionId', $po->nPurchaseOptionId)
                    ->where('nQuantity', '<', 0)
                    ->whereIn('cStatus', ['A', 'P'])  // ✅ Include A + P
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
}
