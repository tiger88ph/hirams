<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderUpdated;
use App\Events\VoucherUpdated;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\PurchaseOrder;
use App\Models\SerialNumber;
use App\Models\VoucherSupplier;
use App\Services\PurchaseOrderStatusSync;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    // ─── Status Code Helpers ──────────────────────────────────────
    private function statusCodes(): array
    {
        return [
            'cart'            => '110',
            'for_approval'    => '120',
            'for_payment'     => '130',
            'pending_receipt' => '140',
            'for_delivery'    => '150',
            'delivered'       => '160',
            'cancelled'       => '170',
            'removed'         => '100',
        ];
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $purchaseOrder = DB::transaction(function () {
                $year    = now()->format('Y');
                $prefix  = 'PO' . $year . '-';
                $last    = PurchaseOrder::where('strPurchaseOrderNo', 'LIKE', $prefix . '%')
                    ->lockForUpdate()
                    ->orderBy('strPurchaseOrderNo', 'desc')
                    ->first();
                $nextSeq = $last
                    ? (int)substr($last->strPurchaseOrderNo, strlen($prefix)) + 1
                    : 1;
                $sequence = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

                // ✅ New PO defaults to Cart status
                return PurchaseOrder::create([
                    'strPurchaseOrderNo' => $prefix . $sequence,
                    'nStatus'            => $this->statusCodes()['cart'], // '110'
                ]);
            });

            broadcast(new PurchaseOrderUpdated('created', $purchaseOrder->nPurchaseOrderId));
            return response()->json([
                'message'       => 'Purchase Order created successfully.',
                'purchaseOrder' => $purchaseOrder,
            ], 201);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to create Purchase Order.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getAllPurchaseOrders(): JsonResponse
    {
        try {
            $purchaseOrders = PurchaseOrder::with([
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction.user',
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction.company',
                'purchaseOrderOptions.purchaseOption.transactionItem.transaction.client', // ← add this
                'purchaseOrderOptions.purchaseOption.supplier',
                'purchaseOrderOptions.purchaseOption.supplierContact',
            ])->get();
            $purchaseOrders->each(
                fn($po) =>
                $po->purchaseOrderOptions->each(
                    fn($poOption) =>
                    $this->attachInventoryStats($poOption)
                )
            );
            return response()->json([
                'message'        => 'Purchase orders retrieved successfully.',
                'purchaseOrders' => $purchaseOrders,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to retrieve purchase orders.', 'error' => $e->getMessage()], 500);
        }
    }

    private function attachInventoryStats($poOption): void
    {
        $nPurchaseItemId = $poOption->purchaseOption?->nPurchaseItemId;
        if (!$nPurchaseItemId) return;

        $receivedRows = Inventory::where('nPurchaseItemId', $nPurchaseItemId)
            ->where('nQuantity', '>', 0)
            ->whereIn('cStatus', ['A', 'P'])
            ->orderBy('dtLog', 'asc')
            ->get();

        $deliveredRows = Inventory::where('nPurchaseItemId', $nPurchaseItemId)
            ->where('nQuantity', '<', 0)
            ->whereIn('cStatus', ['A', 'P'])
            ->orderBy('dtLog', 'asc')
            ->get();

        $poOption->purchaseOption->setAttribute('nInventoryQty', $receivedRows->sum('nQuantity'));
        $poOption->purchaseOption->setAttribute('nInventoryId', $receivedRows->first()?->nInventoryId);
        $poOption->purchaseOption->setAttribute('nDeliveredQty', abs($deliveredRows->sum('nQuantity')));
        $poOption->purchaseOption->setAttribute('nDeliveredInventoryId', $deliveredRows->first()?->nInventoryId);
        $isStatus = fn($status) => fn($r) => trim((string) $r->cStatus) === $status;

        $poOption->purchaseOption->setAttribute('nApprovedReceivedQty',  $receivedRows->filter($isStatus('A'))->sum('nQuantity'));
        $poOption->purchaseOption->setAttribute('nPendingReceivedQty',   $receivedRows->filter($isStatus('P'))->sum('nQuantity'));
        $poOption->purchaseOption->setAttribute('nApprovedDeliveredQty', abs($deliveredRows->filter($isStatus('A'))->sum('nQuantity')));
        $poOption->purchaseOption->setAttribute('nPendingDeliveredQty',  abs($deliveredRows->filter($isStatus('P'))->sum('nQuantity')));
        $receivedSerials = $receivedRows->pluck('nInventoryId')->filter();
        $deliveredSerials = $deliveredRows->pluck('nInventoryId')->filter();

        $poOption->purchaseOption->setAttribute(
            'receivedSerialNumbers',
            $receivedSerials->isNotEmpty() ? SerialNumber::whereIn('nInventoryId', $receivedSerials)->orderBy('dtLog')->pluck('strSerialNumber') : []
        );
        $poOption->purchaseOption->setAttribute(
            'deliveredSerialNumbers',
            $deliveredSerials->isNotEmpty() ? SerialNumber::whereIn('nInventoryId', $deliveredSerials)->orderBy('dtLog')->pluck('strSerialNumber') : []
        );
    }

    // ✅ nStatus lives directly on PurchaseOrder now — no history table involved
    public function updateCartStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId' => 'required|integer|exists:tblpurchaseorders,nPurchaseOrderId',
                'nStatus'          => 'required|string',
                'nUserId'          => 'nullable|integer',
            ]);

            $codes = $this->statusCodes();
            $purchaseOrder = PurchaseOrder::with('purchaseOrderOptions.purchaseOption')->findOrFail($validated['nPurchaseOrderId']);

            // ✅ Update PO status directly
            $purchaseOrder->nStatus = $validated['nStatus'];
            $purchaseOrder->save();

            broadcast(new PurchaseOrderUpdated('status_updated', $purchaseOrder->nPurchaseOrderId, null, $validated['nStatus']));

            // ✅ If Cancelled → propagate to all items (unset inclusion, cancel linked vouchers)
            if ((string)$validated['nStatus'] === (string)$codes['cancelled']) {
                foreach ($purchaseOrder->purchaseOrderOptions as $poOption) {
                    if ($poOption->purchaseOption) {
                        $poOption->purchaseOption->bPurchaseIncluded = 0;
                        $poOption->purchaseOption->save();
                    }
                }

                // Cancel linked vouchers
                $linkedVouchers = VoucherSupplier::with('voucher')
                    ->where('nPurchaseOrderId', $validated['nPurchaseOrderId'])
                    ->get();

                foreach ($linkedVouchers as $vs) {
                    if ($vs->voucher && in_array($vs->voucher->cStatus, ['O', 'C'])) {
                        $vs->voucher->cStatus = 'X';
                        $vs->voucher->save();
                        broadcast(new VoucherUpdated('status_changed', $vs->voucher->nVoucherId));
                    }
                }
            }

            return response()->json([
                'message'       => 'Status updated successfully.',
                'purchaseOrder' => $purchaseOrder,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to update status.', 'error' => $e->getMessage()], 500);
        }
    }

    public function updateCartStatusBulk(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderIds'   => 'required|array|min:1',
                'nPurchaseOrderIds.*' => 'integer|exists:tblpurchaseorders,nPurchaseOrderId',
                'nStatus'             => 'required|string',
                'nUserId'             => 'nullable|integer',
            ]);

            $purchaseOrders = PurchaseOrder::whereIn('nPurchaseOrderId', $validated['nPurchaseOrderIds'])->get();

            DB::transaction(function () use ($purchaseOrders, $validated) {
                foreach ($purchaseOrders as $po) {
                    // ✅ Update PO nStatus directly, no per-item history rows
                    $po->nStatus = $validated['nStatus'];
                    $po->save();

                    broadcast(new PurchaseOrderUpdated('status_synced', $po->nPurchaseOrderId));
                }
            });

            return response()->json([
                'message' => 'Purchase order statuses updated successfully.',
                'updated' => $purchaseOrders->pluck('nPurchaseOrderId'),
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to update statuses.', 'error' => $e->getMessage()], 500);
        }
    }

    // ✅ UPDATED — removed dtProceedToPayment
    public function proceedToPODetails(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId'   => 'required|integer|exists:tblpurchaseorders,nPurchaseOrderId',
                'strShippingDetails' => 'required|string',
                'cPaymentTerms'      => 'required|string|max:1',
            ]);

            $po = PurchaseOrder::findOrFail($validated['nPurchaseOrderId']);
            $po->strShippingDetails = $validated['strShippingDetails'];
            $po->cPaymentTerms      = $validated['cPaymentTerms'];
            $po->save();

            broadcast(new PurchaseOrderUpdated('payment_updated', $po->nPurchaseOrderId));
            return response()->json([
                'message'       => 'Purchase order details updated successfully.',
                'purchaseOrder' => $po,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to update details.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getBySupplier(Request $request): JsonResponse
    {
        try {
            if (!$supplierId = $request->query('nSupplierId')) {
                return response()->json(['message' => 'Supplier ID is required.'], 400);
            }

            $pos = PurchaseOrder::with('purchaseOrderOptions.purchaseOption.transactionItem.transaction')
                ->whereHas('purchaseOrderOptions.purchaseOption', fn($q) => $q->where('nSupplierId', $supplierId))
                ->orderByDesc('nPurchaseOrderId')
                ->get();

            return response()->json(['message' => 'Purchase orders retrieved successfully.', 'data' => $pos]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to retrieve purchase orders.', 'error' => $e->getMessage()], 500);
        }
    }

    // ✅ Sync PO status based on inventory received/delivered totals for a given item.
    //    nStatus now lives on the PO itself (shared across all its items), so this
    //    updates the PO's nStatus directly instead of writing per-item history rows.
    // public function syncPurchaseOrderStatus(Request $request): JsonResponse
    // {
    //     try {
    //         $validated = $request->validate([
    //             'nPurchaseOrderId'  => 'required|integer|exists:tblpurchaseorders,nPurchaseOrderId',
    //             'nPurchaseItemId'   => 'required|integer',
    //             'nUserId'           => 'nullable|integer',
    //             'nReceivedStatus'   => 'required|string',
    //             'nDeliveredStatus'  => 'required|string',
    //             'nPaidStatus'       => 'required|string',
    //         ]);

    //         $po = PurchaseOrder::with([
    //             'purchaseOrderOptions.purchaseOption',
    //         ])->findOrFail($validated['nPurchaseOrderId']);

    //         $items = $po->purchaseOrderOptions
    //             ->pluck('purchaseOption')
    //             ->filter();

    //         if ($items->isEmpty()) {
    //             return response()->json(['message' => 'No items found for this purchase order.'], 200);
    //         }

    //         // ✅ Check ALL items in the PO, not just the one just updated
    //         $allDelivered = true;
    //         $allReceived  = true;

    //         foreach ($items as $item) {
    //             $orderedQty   = (int) $item->nQuantity;
    //             $receivedQty  = (int) Inventory::where('nPurchaseItemId', $item->nPurchaseItemId)
    //                 ->where('nQuantity', '>', 0)
    //                 ->whereIn('cStatus', ['A', 'P'])
    //                 ->sum('nQuantity');
    //             $deliveredQty = (int) abs(Inventory::where('nPurchaseItemId', $item->nPurchaseItemId)
    //                 ->where('nQuantity', '<', 0)
    //                 ->whereIn('cStatus', ['A', 'P'])
    //                 ->sum('nQuantity'));

    //             if ($deliveredQty < $orderedQty) {
    //                 $allDelivered = false;
    //             }
    //             if ($receivedQty < $orderedQty) {
    //                 $allReceived = false;
    //             }
    //         }

    //         $targetStatus = match (true) {
    //             $allDelivered => $validated['nDeliveredStatus'],  // 160 — only if EVERY item fully delivered
    //             $allReceived  => $validated['nReceivedStatus'],   // 150 — only if EVERY item fully received (not forDelivery!)
    //             default       => $validated['nPaidStatus'],       // 140 — stays here until fully received
    //         };

    //         $po->nStatus = $targetStatus;
    //         $po->save();

    //         broadcast(new PurchaseOrderUpdated('status_synced', $po->nPurchaseOrderId));
    //         return response()->json(['message' => 'Purchase order status synced.']);
    //     } catch (ValidationException $e) {
    //         return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
    //     } catch (Exception $e) {
    //         return response()->json(['message' => 'Failed to sync status.', 'error' => $e->getMessage()], 500);
    //     }
    // }
    public function syncPurchaseOrderStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOrderId'  => 'required|integer|exists:tblpurchaseorders,nPurchaseOrderId',
                'nPurchaseItemId'   => 'required|integer',
                'nUserId'           => 'nullable|integer',
                'nReceivedStatus'   => 'required|string',
                'nDeliveredStatus'  => 'required|string',
                'nPaidStatus'       => 'required|string',
            ]);

            app(PurchaseOrderStatusSync::class)->sync(
                (int) $validated['nPurchaseOrderId'],
                $validated['nReceivedStatus'],
                $validated['nDeliveredStatus'],
                $validated['nPaidStatus'],
            );

            broadcast(new PurchaseOrderUpdated('status_synced', $validated['nPurchaseOrderId']));

            return response()->json(['message' => 'Purchase order status synced.']);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to sync status.', 'error' => $e->getMessage()], 500);
        }
    }
}
