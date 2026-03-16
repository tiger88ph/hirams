<?php

namespace App\Http\Controllers\Api;

use App\Events\ItemPricingUpdated;
use App\Helpers\FormulaHelper;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\ItemPricings;
use App\Models\PricingSet;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemPricingController extends Controller
{
    /* ─────────────────────────────────────────────────────────────────
       PRIVATE HELPERS
    ───────────────────────────────────────────────────────────────── */

    private function logError(Exception $e): void
    {
        SqlErrors::create([
            'dtDate'   => TimeHelper::now(),
            'strError' => $e->getMessage(),
        ]);
    }

    private function appendItemPricingsTable($itemPricings): void
    {
        foreach ($itemPricings as $itemPricing) {
            $itemPricing->suggestivePrice = FormulaHelper::calculateSuggestivePrice($itemPricing->nTransactionItemId);
            $itemPricing->tax             = FormulaHelper::calculateTax($itemPricing->nTransactionItemId, $itemPricing->nPricingSetId);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       INDEX
    ───────────────────────────────────────────────────────────────── */

    public function index(Request $request)
    {
        try {
            if ($request->has('pricing_set_id')) {
                $pricingSetId     = $request->pricing_set_id;
                $pricingSet       = \App\Models\PricingSet::findOrFail($pricingSetId);
                $transactionItems = \App\Models\TransactionItems::where('nTransactionId', $pricingSet->nTransactionId)
                    ->orderBy('nItemNumber')
                    ->get();
                $existingPricings = ItemPricings::with(['pricingSet', 'transactionItem'])
                    ->where('nPricingSetId', $pricingSetId)
                    ->get()
                    ->keyBy('nTransactionItemId');

                $itemPricings = $transactionItems->map(function ($item) use ($pricingSetId, $existingPricings) {
                    $pricing = $existingPricings->get($item->nTransactionItemId);
                    return [
                        'nItemPriceId'       => $pricing?->nItemPriceId ?? null,
                        'nPricingSetId'      => $pricingSetId,
                        'nTransactionItemId' => $item->nTransactionItemId,
                        'dUnitSellingPrice'  => $pricing?->dUnitSellingPrice ?? null,
                        'bPricingLocked'     => $pricing?->bPricingLocked ?? null,
                        'suggestivePrice'    => FormulaHelper::calculateSuggestivePrice($item->nTransactionItemId),
                        'tax'                => FormulaHelper::calculateTax($item->nTransactionItemId, $pricingSetId),
                    ];
                });

                return response()->json([
                    'success'      => true,
                    'message'      => 'Item pricings retrieved successfully',
                    'itemPricings' => $itemPricings,
                ], 200);
            }

            $query = ItemPricings::with(['pricingSet', 'transactionItem']);

            if ($request->has('transaction_item_id')) {
                $query->where('nTransactionItemId', $request->transaction_item_id);
            }
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->whereHas('transactionItem', function ($q) use ($search) {
                    $q->where('strItemDescription', 'like', "%{$search}%");
                });
            }

            $query->orderBy(
                $request->get('sort_by', 'nItemPriceId'),
                $request->get('sort_order', 'desc')
            );

            $itemPricings = $query->get();
            $this->appendItemPricingsTable($itemPricings);

            return response()->json([
                'success'      => true,
                'message'      => 'Item pricings retrieved successfully',
                'itemPricings' => $itemPricings,
            ], 200);
        } catch (Exception $e) {
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricings',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       STORE
    ───────────────────────────────────────────────────────────────── */

    public function store(Request $request)
    {
        try {
            $request->validate([
                'nPricingSetId'      => 'required|integer|exists:tblPricingSets,nPricingSetId',
                'nTransactionItemId' => 'required|integer|exists:tblTransactionItems,nTransactionItemId',
                'dUnitSellingPrice'  => 'required|numeric|min:0',
                'bPricingLocked'     => 'nullable|integer|in:0,1',
            ]);

            $exists = ItemPricings::where('nPricingSetId', $request->nPricingSetId)
                ->where('nTransactionItemId', $request->nTransactionItemId)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item pricing already exists for this combination',
                ], 409);
            }

            DB::beginTransaction();

            $itemPricing = ItemPricings::create([
                'nPricingSetId'      => $request->nPricingSetId,
                'nTransactionItemId' => $request->nTransactionItemId,
                'dUnitSellingPrice'  => $request->dUnitSellingPrice,
                'bPricingLocked'     => $request->bPricingLocked ?? 0,
            ]);

            DB::commit();
            $pricingSet = PricingSet::find($itemPricing->nPricingSetId);
            broadcast(new ItemPricingUpdated('created', $itemPricing->nPricingSetId, $pricingSet->nTransactionId, $itemPricing->nItemPriceId))->toOthers();

            return response()->json([
                'success'     => true,
                'message'     => 'Item pricing created successfully',
                'itemPricing' => $itemPricing->load(['pricingSet', 'transactionItem']),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create item pricing',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       SHOW
    ───────────────────────────────────────────────────────────────── */

    public function show($id)
    {
        try {
            $itemPricing = ItemPricings::with(['pricingSet', 'transactionItem'])
                ->findOrFail($id);

            return response()->json([
                'success'     => true,
                'message'     => 'Item pricing retrieved successfully',
                'itemPricing' => $itemPricing,
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found',
            ], 404);
        } catch (Exception $e) {
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricing',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       UPDATE
    ───────────────────────────────────────────────────────────────── */

    public function update(Request $request, $id)
    {
        try {
            $itemPricing = ItemPricings::findOrFail($id);

            $request->validate([
                'nPricingSetId'      => 'sometimes|required|integer|exists:tblPricingSets,nPricingSetId',
                'nTransactionItemId' => 'sometimes|required|integer|exists:tblTransactionItems,nTransactionItemId',
                'dUnitSellingPrice'  => 'sometimes|required|numeric|min:0',
                'bPricingLocked'     => 'sometimes|nullable|integer|in:0,1',
            ]);

            if ($request->has('nPricingSetId') || $request->has('nTransactionItemId')) {
                $pricingSetId      = $request->nPricingSetId      ?? $itemPricing->nPricingSetId;
                $transactionItemId = $request->nTransactionItemId ?? $itemPricing->nTransactionItemId;

                $exists = ItemPricings::where('nPricingSetId', $pricingSetId)
                    ->where('nTransactionItemId', $transactionItemId)
                    ->where('nItemPriceId', '!=', $id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Item pricing already exists for this combination',
                    ], 409);
                }
            }

            DB::beginTransaction();

            $itemPricing->update($request->only([
                'nPricingSetId',
                'nTransactionItemId',
                'dUnitSellingPrice',
                'bPricingLocked',
            ]));

            DB::commit();
            $pricingSet = PricingSet::find($itemPricing->nPricingSetId);
            broadcast(new ItemPricingUpdated('lock_toggled', $itemPricing->nPricingSetId, $pricingSet->nTransactionId, $itemPricing->nItemPriceId))->toOthers();

            return response()->json([
                'success'     => true,
                'message'     => 'Item pricing updated successfully',
                'itemPricing' => $itemPricing->fresh(['pricingSet', 'transactionItem']),
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found',
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update item pricing',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       DESTROY
    ───────────────────────────────────────────────────────────────── */

    public function destroy($id)
    {
        try {
            $itemPricing = ItemPricings::findOrFail($id);

            DB::beginTransaction();
            $itemPricing->delete();
            DB::commit();
            $pricingSet = PricingSet::find($itemPricing->nPricingSetId);
            broadcast(new ItemPricingUpdated('deleted', $itemPricing->nPricingSetId, $pricingSet->nTransactionId, $itemPricing->nItemPriceId))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Item pricing deleted successfully',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found',
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item pricing',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       BULK STORE  — matches frontend payload:
         { nPricingSetId, items: [{ nTransactionItemId, nItemPriceId, dUnitSellingPrice }] }
    ───────────────────────────────────────────────────────────────── */

    public function bulkStore(Request $request)
    {
        try {
            $request->validate([
                'nPricingSetId'                  => 'required|integer|exists:tblPricingSets,nPricingSetId',
                'items'                          => 'required|array|min:1',
                'items.*.nTransactionItemId'     => 'required|integer|exists:tblTransactionItems,nTransactionItemId',
                'items.*.nItemPriceId'           => 'nullable|integer',
                'items.*.dUnitSellingPrice'      => 'nullable|numeric|min:0',
            ]);

            DB::beginTransaction();

            $results = [];

            foreach ($request->items as $item) {
                $price = ($item['dUnitSellingPrice'] !== null && $item['dUnitSellingPrice'] !== '')
                    ? $item['dUnitSellingPrice']
                    : 0; // ← treat empty/null as 0 instead of crashing

                $existing = !empty($item['nItemPriceId'])
                    ? ItemPricings::find($item['nItemPriceId'])
                    : ItemPricings::where('nPricingSetId', $request->nPricingSetId)
                    ->where('nTransactionItemId', $item['nTransactionItemId'])
                    ->first();

                if ($existing) {
                    $existing->update([
                        'dUnitSellingPrice' => $price,
                    ]);
                    $results[] = [
                        'nItemPriceId'       => $existing->nItemPriceId,
                        'nTransactionItemId' => $existing->nTransactionItemId,
                    ];
                } else {
                    $created = ItemPricings::create([
                        'nPricingSetId'      => $request->nPricingSetId,
                        'nTransactionItemId' => $item['nTransactionItemId'],
                        'dUnitSellingPrice'  => $price,
                        'bPricingLocked'     => 0,
                    ]);
                    $results[] = [
                        'nItemPriceId'       => $created->nItemPriceId,
                        'nTransactionItemId' => $created->nTransactionItemId,
                    ];
                }
            }

            DB::commit();
            $pricingSet = PricingSet::find($request->nPricingSetId);
            broadcast(new ItemPricingUpdated('bulk_saved', $request->nPricingSetId, $pricingSet->nTransactionId))->toOthers();
            return response()->json([
                'success'      => true,
                'message'      => 'Bulk item pricings saved successfully',
                'itemPricings' => $results,
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk item pricings',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       GET BY PRICING SET
    ───────────────────────────────────────────────────────────────── */

    public function getByPricingSet($pricingSetId)
    {
        try {
            $itemPricings = ItemPricings::with(['transactionItem'])
                ->where('nPricingSetId', $pricingSetId)
                ->orderBy('nTransactionItemId')
                ->get();

            return response()->json([
                'success'      => true,
                'message'      => 'Item pricings retrieved successfully',
                'itemPricings' => $itemPricings,
            ], 200);
        } catch (Exception $e) {
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricings',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       DELETE BY PRICING SET
    ───────────────────────────────────────────────────────────────── */

    public function deleteByPricingSet($pricingSetId)
    {
        try {
            DB::beginTransaction();
            $count = ItemPricings::where('nPricingSetId', $pricingSetId)->delete();
            DB::commit();

            return response()->json([
                'success'       => true,
                'message'       => 'Item pricings deleted successfully',
                'deleted_count' => $count,
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            $this->logError($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item pricings',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
