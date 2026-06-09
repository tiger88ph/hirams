<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\PurchaseItemHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PurchaseItemHistoryController extends Controller
{
    /**
     * Get the latest history record per nPurchaseOrder_OptionId
     * for a given list of option IDs.
     *
     * POST /api/purchase-item-histories/latest
     * Body: { "ids": [1, 2, 3] }
     */
    public function latestPurchaseOrderOptionsHistory(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nPurchaseOptionId'   => 'required|array|min:1',
                'nPurchaseOptionId.*' => 'integer',
            ]);

            $histories = PurchaseItemHistory::query()
                ->join(
                    'tblpurchaseorder_option',
                    'tblpurchaseitemhistories.nPurchaseOrder_OptionId',
                    '=',
                    'tblpurchaseorder_option.nPurchaseOrder_OptionId'
                )
                ->join(                                                          // ← add this join
                    'tblpurchaseorder',
                    'tblpurchaseorder_option.nPurchaseOrderId',
                    '=',
                    'tblpurchaseorder.nPurchaseOrderId'
                )
                ->whereIn('tblpurchaseorder_option.nPurchaseOptionId', $validated['nPurchaseOptionId'])
                ->select([
                    'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                    'tblpurchaseitemhistories.nPurchaseOrder_OptionId',
                    'tblpurchaseorder_option.nPurchaseOptionId',
                    'tblpurchaseitemhistories.nStatus',
                    'tblpurchaseorder.cStatus',                                  // ← add this
                    'tblpurchaseitemhistories.nUserId',
                    'tblpurchaseitemhistories.dtOccur',
                ])
                ->orderBy('tblpurchaseitemhistories.dtOccur', 'desc')
                ->get()
                ->groupBy('nPurchaseOptionId')
                ->map(fn($group) => $group->first())
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
 * GET /api/purchase-item-histories/option/{nPurchaseOptionId}/all
 */
public function allOptionHistory(int $nPurchaseOptionId): JsonResponse
{
    try {
        $records = PurchaseItemHistory::query()
            ->join(
                'tblpurchaseorder_option',
                'tblpurchaseitemhistories.nPurchaseOrder_OptionId',
                '=',
                'tblpurchaseorder_option.nPurchaseOrder_OptionId'
            )
            ->join(
                'tblpurchaseorder',
                'tblpurchaseorder_option.nPurchaseOrderId',
                '=',
                'tblpurchaseorder.nPurchaseOrderId'
            )
            ->leftJoin(                                         // ← ADD
                'tblusers',
                'tblpurchaseitemhistories.nUserId',
                '=',
                'tblusers.nUserId'
            )
            ->where('tblpurchaseorder_option.nPurchaseOptionId', $nPurchaseOptionId)
            ->select([
                'tblpurchaseitemhistories.nPurchaseItemHistoryId',
                'tblpurchaseitemhistories.nPurchaseOrder_OptionId',
                'tblpurchaseorder_option.nPurchaseOptionId',
                'tblpurchaseitemhistories.nStatus',
                'tblpurchaseorder.cStatus',
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
