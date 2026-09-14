<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderOptionUpdated;
use App\Events\PurchaseOrderUpdated;

use App\Http\Controllers\Controller;
use App\Models\PurchaseItemHistory;
use App\Models\PurchaseOptions;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderOption;
use App\Models\TransactionItems;
use App\Models\Transactions;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderOptionsController extends Controller
{
    public function addToCart(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
                'nUserId'           => 'required|integer',
                'nStatus'           => 'required|integer',
                'isManagement'      => 'required|boolean',
            ]);

            $itemPurchasingKeys = array_keys(config('mappings.item_purchasing_status'));
            $cartStatusKey      = $itemPurchasingKeys[0]; // "Cart" / 110

            // 1. Get purchase option → supplier + item
            $purchaseOption = PurchaseOptions::where('nPurchaseItemId', $validated['nPurchaseItemId'])
                ->firstOrFail();

            $nSupplierId        = $purchaseOption->nSupplierId;
            $nTransactionItemId = $purchaseOption->nTransactionItemId;

            // 2. Get transaction → nAssignedAO + nCompanyId
            $transactionItem = TransactionItems::where('nTransactionItemId', $nTransactionItemId)
                ->firstOrFail();

            $transaction = Transactions::where('nTransactionId', $transactionItem->nTransactionId)
                ->firstOrFail();

            $nAssignedAO = $transaction->nAssignedAO;
            $nCompanyId  = $transaction->nCompanyId;

            // 3. Ownership check — non-management must be the assigned AO
            if (!$validated['isManagement']) {
                if ((int) $validated['nUserId'] !== (int) $nAssignedAO) {
                    return response()->json([
                        'message' => 'Unauthorized. You are not the assigned Account Officer for this transaction.',
                    ], 403);
                }
            }

            // 4 & 5. Find existing OPEN PurchaseOrder for this supplier + company + AO
            // "Open" now means: this PO has at least one option whose LATEST
            // history row is still at the cart status — cStatus is no longer
            // consulted at all.
            DB::beginTransaction();

            $latestHistorySub = DB::table('tblpurchaseitemhistories as h1')
                ->select('h1.nPurchaseOrder_ItemId', 'h1.nStatus')
                ->whereRaw('h1.nPurchaseItemHistoryId = (
                select max(h2.nPurchaseItemHistoryId)
                from tblpurchaseitemhistories h2
                where h2.nPurchaseOrder_ItemId = h1.nPurchaseOrder_ItemId
            )');

            $existingOpenPO = PurchaseOrder::join(
                'tblpurchaseorder_items',
                'tblpurchaseorders.nPurchaseOrderId',
                '=',
                'tblpurchaseorder_items.nPurchaseOrderId'
            )
                ->join('tblpurchaseitems', 'tblpurchaseorder_items.nPurchaseItemId', '=', 'tblpurchaseitems.nPurchaseItemId')
                ->join('tbltransactionitems', 'tblpurchaseitems.nTransactionItemId', '=', 'tbltransactionitems.nTransactionItemId')
                ->join('tbltransactions', 'tbltransactionitems.nTransactionId', '=', 'tbltransactions.nTransactionId')
                ->joinSub($latestHistorySub, 'latest_history', function ($join) {
                    $join->on(
                        'latest_history.nPurchaseOrder_ItemId',
                        '=',
                        'tblpurchaseorder_items.nPurchaseOrder_ItemId'
                    );
                })
                ->where('latest_history.nStatus', $cartStatusKey)
                ->where('tblpurchaseitems.nSupplierId', $nSupplierId)
                ->where('tbltransactions.nCompanyId', $nCompanyId)
                ->where('tbltransactions.nAssignedAO', $nAssignedAO)
                ->select('tblpurchaseorders.nPurchaseOrderId')
                ->lockForUpdate()
                ->first();

            $createNewPO = function () {
                $year   = now()->format('Y');
                $prefix = 'PO' . $year . '-';

                $last = PurchaseOrder::where('strPurchaseOrderNo', 'LIKE', $prefix . '%')
                    ->orderBy('strPurchaseOrderNo', 'desc')
                    ->lockForUpdate()
                    ->first();

                $nextSeq  = $last
                    ? (int) substr($last->strPurchaseOrderNo, strlen($prefix)) + 1
                    : 1;

                $sequence = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

                return PurchaseOrder::create([
                    'strPurchaseOrderNo' => $prefix . $sequence,
                ]);
            };

            $nPurchaseOrderId = $existingOpenPO
                ? $existingOpenPO->nPurchaseOrderId
                : $createNewPO()->nPurchaseOrderId;

            // 6. Insert into tblpurchaseorder_items
            $purchaseOrderOption = PurchaseOrderOption::create([
                'nPurchaseOrderId'  => $nPurchaseOrderId,
                'nPurchaseItemId' => $validated['nPurchaseItemId'],
                'dtAddedToCart'     => now(),
            ]);

            // 7. Insert into tblpurchaseitemhistories — this is now the
            // single source of truth for this option's status.
            PurchaseItemHistory::create([
                'nPurchaseOrder_ItemId' => $purchaseOrderOption->nPurchaseOrder_ItemId,
                'nStatus'                 => $validated['nStatus'],
                'nUserId'                 => $validated['nUserId'],
                'dtOccur'                 => now(),
            ]);

            DB::commit();

            broadcast(new PurchaseOrderOptionUpdated(
                action: 'added_to_cart',
                purchaseOrderOptionId: $purchaseOrderOption->nPurchaseOrder_ItemId,
                purchaseOrderId: $nPurchaseOrderId,
                purchaseOptionId: $validated['nPurchaseItemId'],
                transactionId: $transactionItem->nTransactionId,
            ));
            broadcast(new PurchaseOrderUpdated(
                action: 'updated',
                purchaseOrderId: $nPurchaseOrderId,
            ));

            return response()->json([
                'message'       => 'Added to cart successfully.',
                'purchaseOrder' => $purchaseOrderOption,
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Purchase option or transaction not found.',
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to add to cart.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    public function removeFromCart(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
                'nUserId'           => 'required|integer',
                'nStatus'           => 'required|integer',
                'isManagement'      => 'required|boolean',
            ]);
            $removedFromCartKey = array_keys(config('mappings.removed_from_cart_status'))[0] ?? null;
            // 1. Get purchase option → verify it exists
            $purchaseOption = PurchaseOptions::where('nPurchaseItemId', $validated['nPurchaseItemId'])
                ->firstOrFail();

            $nTransactionItemId = $purchaseOption->nTransactionItemId;

            // 2. Ownership check — non-management must be the assigned AO
            $transactionItem = TransactionItems::where('nTransactionItemId', $nTransactionItemId)
                ->firstOrFail();

            $transaction = Transactions::where('nTransactionId', $transactionItem->nTransactionId)
                ->firstOrFail();

            if (!$validated['isManagement']) {
                if ((int) $validated['nUserId'] !== (int) $transaction->nAssignedAO) {
                    return response()->json([
                        'message' => 'Unauthorized. You are not the assigned Account Officer for this transaction.',
                    ], 403);
                }
            }

            // 3. Find the latest active cart history entry for this option
            $latestHistory = PurchaseItemHistory::query()
                ->join('tblpurchaseorder_items', 'tblpurchaseitemhistories.nPurchaseOrder_ItemId', '=', 'tblpurchaseorder_items.nPurchaseOrder_ItemId')
                ->where('tblpurchaseorder_items.nPurchaseItemId', $validated['nPurchaseItemId'])
                ->orderByDesc('tblpurchaseitemhistories.nPurchaseItemHistoryId')
                ->select('tblpurchaseitemhistories.*', 'tblpurchaseorder_items.nPurchaseOrderId')
                ->first();

            if (!$latestHistory) {
                return response()->json([
                    'message' => 'No active cart entry found for this option.',
                ], 404);
            }

            // 4. Insert a "removed from cart" history entry, delete option, maybe delete PO
            DB::beginTransaction();

            $newHistory = PurchaseItemHistory::create([
                'nPurchaseOrder_ItemId' => $latestHistory->nPurchaseOrder_ItemId,
                'nStatus'                 => $validated['nStatus'],
                'nUserId'                 => $validated['nUserId'],
                'dtOccur'                 => now(),
            ]);

            // Delete the purchase order option record
            PurchaseOrderOption::where('nPurchaseOrder_ItemId', $latestHistory->nPurchaseOrder_ItemId)
                ->delete();

            // Check if this PO has any remaining options
            $remainingOptions = PurchaseOrderOption::where('nPurchaseOrderId', $latestHistory->nPurchaseOrderId)
                ->count();

            $poWasDeleted = $remainingOptions === 0;

            if ($poWasDeleted) {
                PurchaseOrder::where('nPurchaseOrderId', $latestHistory->nPurchaseOrderId)->delete();
            }

            // ✅ COMMIT FIRST — deletions are persisted before broadcasting.
            DB::commit();

            broadcast(new PurchaseOrderOptionUpdated(
                action: 'removed_from_cart',
                purchaseOrderOptionId: $latestHistory->nPurchaseOrder_ItemId,
                purchaseOrderId: $latestHistory->nPurchaseOrderId,
                purchaseOptionId: $validated['nPurchaseItemId'],
                transactionId: $transactionItem->nTransactionId, // ← ADD (already in scope)
            ));

            if ($poWasDeleted) {
                broadcast(new PurchaseOrderUpdated(
                    action: 'deleted',
                    purchaseOrderId: $latestHistory->nPurchaseOrderId,
                ));
            } else {
                broadcast(new PurchaseOrderUpdated(
                    action: 'updated',
                    purchaseOrderId: $latestHistory->nPurchaseOrderId,
                ));
            }

            return response()->json([
                'message' => 'Removed from cart successfully.',
                'history' => $newHistory,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Purchase option or transaction not found.',
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to remove from cart.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
