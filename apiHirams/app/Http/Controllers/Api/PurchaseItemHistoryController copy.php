<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\PurchaseItemHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseItemHistoryController extends Controller
{
    public function index(): JsonResponse
    {
        $histories = PurchaseItemHistory::all();
        return response()->json([
            'success' => true,
            'data' => $histories
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nPurchaseOptionId' => 'required|integer',
            'nStatus'           => 'required|integer',
            'nUserId'           => 'required|integer',
        ]);

        $validated['dtOccur'] = TimeHelper::now()->format('Y-m-d H:i:s');

        $history = PurchaseItemHistory::create($validated);
        return response()->json([
            'success' => true,
            'message' => 'Record created successfully.',
            'data'    => $history
        ], 201);
    }


    public function show($id): JsonResponse
    {
        $history = PurchaseItemHistory::find($id);

        if (!$history) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $history
        ], 200);
    }


    public function update(Request $request, $id): JsonResponse
    {
        $history = PurchaseItemHistory::find($id);
        if (!$history) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found.'
            ], 404);
        }

        $validated = $request->validate([
            'nPurchaseOptionId' => 'sometimes|required|integer',
            'nStatus'           => 'sometimes|required|integer',
            'nUserId'           => 'sometimes|required|integer',
        ]);

        $validated['dtOccur'] = TimeHelper::now()->format('Y-m-d H:i:s');

        $history->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Record updated successfully.',
            'data'    => $history
        ], 200);
    }

    public function destroy($id): JsonResponse
    {
        $history = PurchaseItemHistory::find($id);

        if (!$history) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found.'
            ], 404);
        }

        $history->delete();

        return response()->json([
            'success' => true,
            'message' => 'Record deleted successfully.'
        ], 200);
    }
    public function latestPurchaseHistory(int $purchaseOptionId): JsonResponse
    {
        $history = PurchaseItemHistory::where('nPurchaseOptionId', $purchaseOptionId)
            ->orderBy('dtOccur', 'desc')
            ->orderBy('nPurchaseItemHistoryId', 'desc')
            ->first();

        if (!$history) {
            return response()->json([
                'success' => false,
                'message' => 'No history found for this purchase option.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $history
        ], 200);
    }
    public function latestBatch(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ])['ids'];

        // One query: get the latest history row per purchase option ID
        $histories = PurchaseItemHistory::whereIn('nPurchaseOptionId', $ids)
            ->orderBy('dtOccur', 'desc')
            ->orderBy('nPurchaseItemHistoryId', 'desc')
            ->get()
            ->unique('nPurchaseOptionId')   // keep only latest per option
            ->keyBy('nPurchaseOptionId');

        return response()->json([
            'success' => true,
            'data'    => $histories,        // keyed map: optionId → history
        ]);
    }
}
