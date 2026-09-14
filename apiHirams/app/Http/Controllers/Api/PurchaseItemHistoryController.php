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
    private function statusCodes(): array
    {
        return [
            'for_approval' => '120',
            'for_payment'  => '130',
            'delivered'    => '160',
            'cancelled'    => '170',
        ];
    }

    public function latestPurchaseOrderOptionsHistory(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseItemId'   => 'required|array|min:1',
                'nPurchaseItemId.*' => 'integer',
            ]);

            $codes = $this->statusCodes();

            $histories = PurchaseItemHistory::join('tblpurchaseorder_items', 'tblpurchaseitemhistories.nPurchaseOrder_ItemId', '=', 'tblpurchaseorder_items.nPurchaseOrder_ItemId')
                ->join('tblpurchaseorders', 'tblpurchaseorder_items.nPurchaseOrderId', '=', 'tblpurchaseorders.nPurchaseOrderId')
                ->whereIn('tblpurchaseorder_items.nPurchaseItemId', $validated['nPurchaseItemId'])
                ->select([
                    'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    'tblpurchaseorder_items.nPurchaseItemId',
                    'tblpurchaseorder_items.nPurchaseOrderId',
                    'tblpurchaseitemhistories.nStatus',
                    'tblpurchaseorders.nStatus as po_nStatus',
                    'tblpurchaseitemhistories.nUserId',
                    'tblpurchaseitemhistories.dtOccur',
                ])
                ->orderByDesc('tblpurchaseitemhistories.dtOccur')
                ->get()
                ->groupBy('nPurchaseItemId')
                ->map(function ($group) use ($codes) {
                    $latest = $group->first();

                    // ✅ If status = For Payment ('130') but voucher cancelled → fallback to For Approval ('120')
                    if ((string)$latest->nStatus === (string)$codes['for_payment']) {
                        $voucherStatus = DB::table('tblvoucher_suppliers')
                            ->join('tblvouchers', 'tblvoucher_suppliers.nVoucherId', '=', 'tblvouchers.nVoucherId')
                            ->where('tblvoucher_suppliers.nPurchaseOrderId', $latest->nPurchaseOrderId)
                            ->value('tblvouchers.cStatus');

                        if ((string)$voucherStatus === 'X') {
                            $latest->nStatus = $codes['for_approval'];
                        }
                    }
                    return $latest;
                })
                ->values();

            return response()->json(['message' => 'Latest histories retrieved successfully.', 'histories' => $histories]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to retrieve histories.', 'error' => $e->getMessage()], 500);
        }
    }

    public function allOptionHistory(int $nPurchaseItemId): JsonResponse
    {
        try {
            $records = PurchaseItemHistory::join('tblpurchaseorder_items', 'tblpurchaseitemhistories.nPurchaseOrder_ItemId', '=', 'tblpurchaseorder_items.nPurchaseOrder_ItemId')
                ->join('tblpurchaseorders', 'tblpurchaseorder_items.nPurchaseOrderId', '=', 'tblpurchaseorders.nPurchaseOrderId')
                ->leftJoin('tblusers', 'tblpurchaseitemhistories.nUserId', '=', 'tblusers.nUserId')
                ->where('tblpurchaseorder_items.nPurchaseItemId', $nPurchaseItemId)
                ->select([
                    'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                    'tblpurchaseitemhistories.nPurchaseOrder_ItemId',
                    'tblpurchaseorder_items.nPurchaseItemId',
                    'tblpurchaseitemhistories.nStatus',
                    'tblpurchaseorders.nStatus as po_nStatus',
                    'tblpurchaseitemhistories.nUserId',
                    'tblpurchaseitemhistories.dtOccur',
                    'tblusers.strFName', 'tblusers.strMName', 'tblusers.strLName', 'tblusers.strNickName', 'tblusers.strProfileImage',
                ])
                ->orderByDesc('tblpurchaseitemhistories.dtOccur')
                ->get();

            return $records->isEmpty()
                ? response()->json(['message' => 'No history found for this option.', 'histories' => []], 404)
                : response()->json(['message' => 'All histories retrieved successfully.', 'histories' => $records]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to retrieve histories.', 'error' => $e->getMessage()], 500);
        }
    }
}