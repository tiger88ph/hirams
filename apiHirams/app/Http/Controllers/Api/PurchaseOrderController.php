<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\PurchaseItemHistory;
use App\Models\PurchaseOrder;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

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
                'purchaseOrderOptions.purchaseOption.supplierContact', // ← ADD
                'purchaseOrderOptions.latestHistory',
            ])->get();

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
                'cancelCartKey'    => 'required|string|max:1',
                'cancelPoKey'      => 'nullable|integer',
                'nUserId'          => 'nullable|integer',
            ]);

            $purchaseOrder = PurchaseOrder::with('purchaseOrderOptions.purchaseOption')
                ->findOrFail($validated['nPurchaseOrderId']);

            $purchaseOrder->cStatus = $validated['cStatus'];
            $purchaseOrder->save();
            broadcast(new PurchaseOrderUpdated(
                action: 'status_updated',
                purchaseOrderId: $purchaseOrder->nPurchaseOrderId,
                newStatus: $validated['cStatus'], // ← ADD
            ));
            if (
                isset($validated['cancelPoKey']) &&
                $validated['cStatus'] === $validated['cancelCartKey']
            ) {
                $now = TimeHelper::now();
                foreach ($purchaseOrder->purchaseOrderOptions as $poOption) {
                    PurchaseItemHistory::create([
                        'nPurchaseOrder_OptionId' => $poOption->nPurchaseOrder_OptionId,
                        'nStatus'                 => $validated['cancelPoKey'],
                        'nUserId'                 => $validated['nUserId'] ?? null,
                        'dtOccur'                 => $now,
                    ]);

                    if ($poOption->purchaseOption) {
                        $poOption->purchaseOption->bPurchaseIncluded = 0;
                        $poOption->purchaseOption->save();
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
            // Insert a history row for every option linked to this PO
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
}
