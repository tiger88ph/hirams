<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderOptionUpdated;
use App\Events\PurchaseOrderUpdated;
use App\Helpers\TimeHelper;
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
                'nPurchaseOptionId' => 'required|integer',
                'nUserId'           => 'required|integer',
                'nStatus'           => 'required|integer',
                'isManagement'      => 'required|boolean',
            ]);

            $cartStatusKeys = array_keys(config('mappings.cart_status'));

            // 1. Get purchase option → supplier + item
            $purchaseOption = PurchaseOptions::where('nPurchaseOptionId', $validated['nPurchaseOptionId'])
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
            // 4 & 5. Find existing OPEN PurchaseOrder for this supplier + company + AO, then resolve
            DB::beginTransaction();

            $openStatusKey = $cartStatusKeys[0];

            $existingOpenPO = PurchaseOrder::join('tblpurchaseorder_option', 'tblpurchaseorder.nPurchaseOrderId', '=', 'tblpurchaseorder_option.nPurchaseOrderId')
                ->join('tblpurchaseoptions', 'tblpurchaseorder_option.nPurchaseOptionId', '=', 'tblpurchaseoptions.nPurchaseOptionId')
                ->join('tbltransactionitems', 'tblpurchaseoptions.nTransactionItemId', '=', 'tbltransactionitems.nTransactionItemId')
                ->join('tbltransactions', 'tbltransactionitems.nTransactionId', '=', 'tbltransactions.nTransactionId')
                ->where('tblpurchaseorder.cStatus', $openStatusKey)
                ->where('tblpurchaseoptions.nSupplierId', $nSupplierId)
                ->where('tbltransactions.nCompanyId', $nCompanyId)
                ->where('tbltransactions.nAssignedAO', $nAssignedAO)
                ->select('tblpurchaseorder.nPurchaseOrderId')
                ->lockForUpdate()
                ->first();

            $createNewPO = function () use ($cartStatusKeys) {
                $year     = now()->format('Y');
                $prefix   = $year . '-';

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
                    'cStatus'            => $cartStatusKeys[0],
                ]);
            };

            $nPurchaseOrderId = $existingOpenPO
                ? $existingOpenPO->nPurchaseOrderId
                : $createNewPO()->nPurchaseOrderId;
            // 6. Insert into tblpurchaseorder_option
            $purchaseOrderOption = PurchaseOrderOption::create([
                'nPurchaseOrderId'  => $nPurchaseOrderId,
                'nPurchaseOptionId' => $validated['nPurchaseOptionId'],
                'dtAddedToCart'     => TimeHelper::now(),
            ]);

            // 7. Insert into tblpurchaseitemhistories
            PurchaseItemHistory::create([
                'nPurchaseOrder_OptionId' => $purchaseOrderOption->nPurchaseOrder_OptionId,
                'nStatus'                 => $validated['nStatus'],
                'nUserId'                 => $validated['nUserId'],
                'dtOccur'                 => TimeHelper::now(),
            ]);

            // ✅ COMMIT FIRST — all rows are now persisted and readable by
            // the frontend's follow-up fetch that the broadcasts will trigger.
            DB::commit();

            // ✅ Broadcast AFTER commit — no race condition.
            broadcast(new PurchaseOrderOptionUpdated(
                action: 'added_to_cart',
                purchaseOrderOptionId: $purchaseOrderOption->nPurchaseOrder_OptionId,
                purchaseOrderId: $nPurchaseOrderId,
                purchaseOptionId: $validated['nPurchaseOptionId'],
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
                'nPurchaseOptionId' => 'required|integer',
                'nUserId'           => 'required|integer',
                'nStatus'           => 'required|integer',
                'isManagement'      => 'required|boolean',
            ]);

            // 1. Get purchase option → verify it exists
            $purchaseOption = PurchaseOptions::where('nPurchaseOptionId', $validated['nPurchaseOptionId'])
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
                ->join('tblpurchaseorder_option', 'tblpurchaseitemhistories.nPurchaseOrder_OptionId', '=', 'tblpurchaseorder_option.nPurchaseOrder_OptionId')
                ->where('tblpurchaseorder_option.nPurchaseOptionId', $validated['nPurchaseOptionId'])
                ->orderByDesc('tblpurchaseitemhistories.nPurchaseItemHistoryId')
                ->select('tblpurchaseitemhistories.*', 'tblpurchaseorder_option.nPurchaseOrderId')
                ->first();

            if (!$latestHistory) {
                return response()->json([
                    'message' => 'No active cart entry found for this option.',
                ], 404);
            }

            // 4. Insert a "removed from cart" history entry, delete option, maybe delete PO
            DB::beginTransaction();

            $newHistory = PurchaseItemHistory::create([
                'nPurchaseOrder_OptionId' => $latestHistory->nPurchaseOrder_OptionId,
                'nStatus'                 => $validated['nStatus'],
                'nUserId'                 => $validated['nUserId'],
                'dtOccur'                 => TimeHelper::now(),
            ]);

            // Delete the purchase order option record
            PurchaseOrderOption::where('nPurchaseOrder_OptionId', $latestHistory->nPurchaseOrder_OptionId)
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

            // ✅ Broadcast AFTER commit — frontend fetch will see the correct state.
            broadcast(new PurchaseOrderOptionUpdated(
                action: 'removed_from_cart',
                purchaseOrderOptionId: $latestHistory->nPurchaseOrder_OptionId,
                purchaseOrderId: $latestHistory->nPurchaseOrderId,
                purchaseOptionId: $validated['nPurchaseOptionId'],
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
