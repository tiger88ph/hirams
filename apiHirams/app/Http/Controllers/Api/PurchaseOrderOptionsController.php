<?php

namespace App\Http\Controllers\Api;

use App\Events\PurchaseOrderOptionUpdated;
use App\Events\PurchaseOrderUpdated;
use App\Http\Controllers\Controller;
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
    private function statusCodes(): array
    {
        return [
            'cart'      => '110',
            'cancelled' => '170',
            'removed'   => '100',
        ];
    }

    public function addToCart(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
                'nUserId'         => 'required|integer',
                'nStatus'         => 'required|string', // ✅ '110' from frontend
                'isManagement'    => 'required|boolean',
            ]);

            $codes = $this->statusCodes();

            // Get linked records
            $purchaseOption   = PurchaseOptions::where('nPurchaseItemId', $validated['nPurchaseItemId'])->firstOrFail();
            $transactionItem  = TransactionItems::where('nTransactionItemId', $purchaseOption->nTransactionItemId)->firstOrFail();
            $transaction      = Transactions::where('nTransactionId', $transactionItem->nTransactionId)->firstOrFail();

            // Permissions
            if (!$validated['isManagement'] && (int)$validated['nUserId'] !== (int)$transaction->nAssignedAO) {
                return response()->json(['message' => 'Unauthorized. Not the assigned Account Officer.'], 403);
            }

            DB::beginTransaction();

            // ✅ Find open PO directly via PurchaseOrder.nStatus (no history table)
            $existingOpenPO = PurchaseOrder::join('tblpurchaseorder_items', 'tblpurchaseorders.nPurchaseOrderId', '=', 'tblpurchaseorder_items.nPurchaseOrderId')
                ->join('tblpurchaseitems', 'tblpurchaseorder_items.nPurchaseItemId', '=', 'tblpurchaseitems.nPurchaseItemId')
                ->join('tbltransactionitems', 'tblpurchaseitems.nTransactionItemId', '=', 'tbltransactionitems.nTransactionItemId')
                ->join('tbltransactions', 'tbltransactionitems.nTransactionId', '=', 'tbltransactions.nTransactionId')
                ->where('tblpurchaseorders.nStatus', $codes['cart'])
                ->where('tblpurchaseitems.nSupplierId', $purchaseOption->nSupplierId)
                ->where('tbltransactions.nCompanyId', $transaction->nCompanyId)
                ->where('tbltransactions.nAssignedAO', $transaction->nAssignedAO)
                ->select('tblpurchaseorders.nPurchaseOrderId')
                ->lockForUpdate()
                ->first();

            $createPO = function () use ($codes) {
                $year    = now()->format('Y');
                $prefix  = 'PO' . $year . '-';
                $last    = PurchaseOrder::where('strPurchaseOrderNo', 'LIKE', "$prefix%")->orderByDesc('strPurchaseOrderNo')->lockForUpdate()->first();
                $nextSeq = $last ? ((int)substr($last->strPurchaseOrderNo, strlen($prefix)) + 1) : 1;
                return PurchaseOrder::create([
                    'strPurchaseOrderNo' => $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT),
                    'nStatus'            => $codes['cart'],
                ]);
            };

            $poId = $existingOpenPO?->nPurchaseOrderId ?? $createPO()->nPurchaseOrderId;

            // ✅ Create PO Option only — status lives on the PO, no history row needed
            $poOption = PurchaseOrderOption::create([
                'nPurchaseOrderId' => $poId,
                'nPurchaseItemId'  => $validated['nPurchaseItemId'],
                'dtAddedToCart'    => now(),
            ]);

            DB::commit();

            broadcast(new PurchaseOrderOptionUpdated('added_to_cart', $poOption->nPurchaseOrder_ItemId, $poId, $validated['nPurchaseItemId'], $transactionItem->nTransactionId));
            broadcast(new PurchaseOrderUpdated('updated', $poId));

            return response()->json(['message' => 'Added to cart successfully.', 'purchaseOrder' => $poOption], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase option or transaction not found.'], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to add to cart.', 'error' => $e->getMessage()], 500);
        }
    }

    public function removeFromCart(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId' => 'required|integer',
                'nUserId'         => 'required|integer',
                'nStatus'         => 'required|string', // kept for API-shape compatibility, unused now
                'isManagement'    => 'required|boolean',
            ]);

            // Verify item exists + permissions
            $purchaseOption  = PurchaseOptions::where('nPurchaseItemId', $validated['nPurchaseItemId'])->firstOrFail();
            $transactionItem = TransactionItems::where('nTransactionItemId', $purchaseOption->nTransactionItemId)->firstOrFail();
            $transaction     = Transactions::where('nTransactionId', $transactionItem->nTransactionId)->firstOrFail();

            if (!$validated['isManagement'] && (int)$validated['nUserId'] !== (int)$transaction->nAssignedAO) {
                return response()->json(['message' => 'Unauthorized. Not the assigned Account Officer.'], 403);
            }

            // ✅ Find the PO option directly — no history lookup needed
            $poOption = PurchaseOrderOption::where('nPurchaseItemId', $validated['nPurchaseItemId'])->first();

            if (!$poOption) {
                return response()->json(['message' => 'No active cart entry found for this option.'], 404);
            }

            $purchaseOrderId = $poOption->nPurchaseOrderId;

            DB::beginTransaction();

            // Delete option record
            $poOption->delete();

            // Delete PO if empty
            $remaining = PurchaseOrderOption::where('nPurchaseOrderId', $purchaseOrderId)->count();
            $poDeleted = $remaining === 0;
            if ($poDeleted) {
                PurchaseOrder::where('nPurchaseOrderId', $purchaseOrderId)->delete();
            }

            DB::commit();

            broadcast(new PurchaseOrderOptionUpdated('removed_from_cart', $poOption->nPurchaseOrder_ItemId, $purchaseOrderId, $validated['nPurchaseItemId'], $transactionItem->nTransactionId));
            broadcast(new PurchaseOrderUpdated($poDeleted ? 'deleted' : 'updated', $purchaseOrderId));

            return response()->json(['message' => 'Removed from cart successfully.'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase option or transaction not found.'], 404);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to remove from cart.', 'error' => $e->getMessage()], 500);
        }
    }
}
