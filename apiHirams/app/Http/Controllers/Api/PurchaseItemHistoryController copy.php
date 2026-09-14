<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\PurchaseItemHistory;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseItemHistoryController extends Controller
{
    /**
     * Get the latest history record per nPurchaseOrder_ItemId
     * for a given list of option IDs.
     *
     * POST /api/purchase-item-histories/latest
     * Body: { "ids": [1, 2, 3] }
     */
    public function latestPurchaseOrderOptionsHistory(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId'   => 'required|array|min:1',
                'nPurchaseItemId.*' => 'integer',
            ]);

            $voucherStatusKeys    = array_keys(config('mappings.voucher_status'));
            $forPurchaseStatusKeys = array_keys(config('mappings.for_purchase_status'));

            $openStatusKey      = $voucherStatusKeys[0];
            $closedStatusKey    = $voucherStatusKeys[1];
            $cancelledStatusKey = $voucherStatusKeys[3];

            $cancelledKey     = $forPurchaseStatusKeys[0];
            $addToCartKey     = $forPurchaseStatusKeys[1];
            $purchaseOrderKey = $forPurchaseStatusKeys[2];
            $paidKey          = $forPurchaseStatusKeys[3];

            $histories = PurchaseItemHistory::query()
                ->join(
                    'tblpurchaseorder_items',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    '=',
                    'tblpurchaseorder_items.nPurchaseOrder_ItemId'
                )
                ->join(
                    'tblpurchaseorders',
                    'tblpurchaseorder_items.nPurchaseOrderId',
                    '=',
                    'tblpurchaseorders.nPurchaseOrderId'
                )
                ->whereIn('tblpurchaseorder_items.nPurchaseItemId', $validated['nPurchaseItemId'])
                ->select([
                    'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    'tblpurchaseorder_items.nPurchaseItemId',
                    'tblpurchaseorder_items.nPurchaseOrderId',
                    'tblpurchaseitemhistories.nStatus',
                    'tblpurchaseorders.cStatus',
                    'tblpurchaseitemhistories.nUserId',
                    'tblpurchaseitemhistories.dtOccur',
                ])
                ->orderBy('tblpurchaseitemhistories.dtOccur', 'desc')
                ->get()
                ->groupBy('nPurchaseItemId')
                ->map(function ($group) use ($paidKey, $purchaseOrderKey, $cancelledStatusKey) {
                    $latest = $group->first();

                    if ((string) $latest->nStatus === (string) $paidKey) {
                        $voucherStatus = DB::table('tblvoucher_suppliers')
                            ->join('tblvouchers', 'tblvoucher_suppliers.nVoucherId', '=', 'tblvouchers.nVoucherId')
                            ->where('tblvoucher_suppliers.nPurchaseOrderId', $latest->nPurchaseOrderId)
                            ->value('tblvouchers.cStatus');

                        if ((string) $voucherStatus === (string) $cancelledStatusKey) {
                            $latest->nStatus = $purchaseOrderKey;
                        }
                    }

                    return $latest;
                })
                ->values();

            return response()->json([
                'message'   => 'Latest histories retrieved successfully.',
                'histories' => $histories,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve histories.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Get all history records for a single option ID.
     *
     * GET /api/purchase-item-histories/option/{nPurchaseItemId}/all
     */
    public function allOptionHistory(int $nPurchaseItemId): JsonResponse
    {
        try {
            $records = PurchaseItemHistory::query()
                ->join(
                    'tblpurchaseorder_items',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    '=',
                    'tblpurchaseorder_items.nPurchaseOrder_ItemId'
                )
                ->join(
                    'tblpurchaseorders',
                    'tblpurchaseorder_items.nPurchaseOrderId',
                    '=',
                    'tblpurchaseorders.nPurchaseOrderId'
                )
                ->leftJoin(                                         // ← ADD
                    'tblusers',
                    'tblpurchaseitemhistories.nUserId',
                    '=',
                    'tblusers.nUserId'
                )
                ->where('tblpurchaseorder_items.nPurchaseItemId', $nPurchaseItemId)
                ->select([
                    'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    'tblpurchaseorder_items.nPurchaseItemId',
                    'tblpurchaseitemhistories.nStatus',
                    'tblpurchaseorders.cStatus',
                    'tblpurchaseitemhistories.nUserId',
                    'tblpurchaseitemhistories.dtOccur',
                    // ── User fields ──────────────────────────────── ← ADD
                    'tblusers.strFName',
                    'tblusers.strMName',
                    'tblusers.strLName',
                    'tblusers.strNickName',
                    'tblusers.strProfileImage',
                ])
                ->orderBy('tblpurchaseitemhistories.dtOccur', 'desc')
                ->get();

            if ($records->isEmpty()) {
                return response()->json([
                    'message'   => 'No history found for this option.',
                    'histories' => [],
                ], 404);
            }

            return response()->json([
                'message'   => 'All histories retrieved successfully.',
                'histories' => $records,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve histories.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
