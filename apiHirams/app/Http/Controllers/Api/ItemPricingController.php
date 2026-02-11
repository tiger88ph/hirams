<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Exception;
use App\Models\ItemPricings;
use App\Models\SqlErrors;

class ItemPricingController extends Controller
{
    /**
     * Display a listing of item pricings
     * GET /api/item-pricings
     */
    public function index(Request $request)
    {
        try {
            $query = ItemPricings::with(['pricingSet', 'transactionItem']);

            // Filter by pricing set
            if ($request->has('pricing_set_id')) {
                $query->where('nPricingSetId', $request->pricing_set_id);
            }

            // Filter by transaction item
            if ($request->has('transaction_item_id')) {
                $query->where('nTransactionItemId', $request->transaction_item_id);
            }

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->whereHas('transactionItem', function ($q) use ($search) {
                    $q->where('strItemDescription', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'nItemPriceId');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination or get all
            if ($request->has('per_page')) {
                $perPage = $request->get('per_page', 15);
                $itemPricings = $query->paginate($perPage);
            } else {
                $itemPricings = $query->get();
            }

            return response()->json([
                'success' => true,
                'message' => 'Item pricings retrieved successfully',
                'itemPricings' => $itemPricings
            ], 200);

        } catch (Exception $e) {
            SqlErrors::logError($e, $request);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created item pricing
     * POST /api/item-pricings
     */
    public function store(Request $request)
    {
        try {
            // Validation
            $validator = Validator::make($request->all(), [
                'nPricingSetId' => 'required|integer|exists:tblPricingSets,nPricingSetId',
                'nTransactionItemId' => 'required|integer|exists:tblTransactionItems,nTransactionItemId',
                'dUnitSellingPrice' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for duplicate entry
            $exists = ItemPricings::where('nPricingSetId', $request->nPricingSetId)
                ->where('nTransactionItemId', $request->nTransactionItemId)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item pricing already exists for this combination'
                ], 409);
            }

            DB::beginTransaction();

            $itemPricing = ItemPricings::create([
                'nPricingSetId' => $request->nPricingSetId,
                'nTransactionItemId' => $request->nTransactionItemId,
                'dUnitSellingPrice' => $request->dUnitSellingPrice
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Item pricing created successfully',
                'itemPricing' => $itemPricing->load(['pricingSet', 'transactionItem'])
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            SqlErrors::logError($e, $request);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create item pricing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified item pricing
     * GET /api/item-pricings/{id}
     */
    public function show($id)
    {
        try {
            $itemPricing = ItemPricings::with(['pricingSet', 'transactionItem'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Item pricing retrieved successfully',
                'itemPricing' => $itemPricing
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found'
            ], 404);
        } catch (Exception $e) {
            SqlErrors::logError($e, request());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified item pricing
     * PUT/PATCH /api/item-pricings/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $itemPricing = ItemPricings::findOrFail($id);

            // Validation
            $validator = Validator::make($request->all(), [
                'nPricingSetId' => 'sometimes|required|integer|exists:tblPricingSets,nPricingSetId',
                'nTransactionItemId' => 'sometimes|required|integer|exists:tblTransactionItems,nTransactionItemId',
                'dUnitSellingPrice' => 'sometimes|required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for duplicate if pricing set or transaction item is being changed
            if ($request->has('nPricingSetId') || $request->has('nTransactionItemId')) {
                $pricingSetId = $request->nPricingSetId ?? $itemPricing->nPricingSetId;
                $transactionItemId = $request->nTransactionItemId ?? $itemPricing->nTransactionItemId;

                $exists = ItemPricings::where('nPricingSetId', $pricingSetId)
                    ->where('nTransactionItemId', $transactionItemId)
                    ->where('nItemPriceId', '!=', $id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Item pricing already exists for this combination'
                    ], 409);
                }
            }

            DB::beginTransaction();

            $itemPricing->update($request->only([
                'nPricingSetId',
                'nTransactionItemId',
                'dUnitSellingPrice'
            ]));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Item pricing updated successfully',
                'itemPricing' => $itemPricing->fresh(['pricingSet', 'transactionItem'])
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            SqlErrors::logError($e, $request);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update item pricing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified item pricing
     * DELETE /api/item-pricings/{id}
     */
    public function destroy($id)
    {
        try {
            $itemPricing = ItemPricings::findOrFail($id);

            DB::beginTransaction();

            $itemPricing->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Item pricing deleted successfully'
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Item pricing not found'
            ], 404);
        } catch (Exception $e) {
            DB::rollBack();
            SqlErrors::logError($e, request());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item pricing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk store/update item pricings
     * POST /api/item-pricings/bulk
     */
    public function bulkStore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricings' => 'required|array|min:1',
                'pricings.*.nPricingSetId' => 'required|integer|exists:tblPricingSets,nPricingSetId',
                'pricings.*.nTransactionItemId' => 'required|integer|exists:tblTransactionItems,nTransactionItemId',
                'pricings.*.dUnitSellingPrice' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $created = [];
            $updated = [];
            $errors = [];

            foreach ($request->pricings as $pricing) {
                try {
                    // Check if exists
                    $existing = ItemPricings::where('nPricingSetId', $pricing['nPricingSetId'])
                        ->where('nTransactionItemId', $pricing['nTransactionItemId'])
                        ->first();

                    if ($existing) {
                        // Update existing
                        $existing->update([
                            'dUnitSellingPrice' => $pricing['dUnitSellingPrice']
                        ]);
                        $updated[] = $existing;
                    } else {
                        // Create new
                        $new = ItemPricings::create([
                            'nPricingSetId' => $pricing['nPricingSetId'],
                            'nTransactionItemId' => $pricing['nTransactionItemId'],
                            'dUnitSellingPrice' => $pricing['dUnitSellingPrice']
                        ]);
                        $created[] = $new;
                    }
                } catch (Exception $e) {
                    $errors[] = [
                        'pricing' => $pricing,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk item pricings processed successfully',
                'summary' => [
                    'created' => count($created),
                    'updated' => count($updated),
                    'errors' => count($errors)
                ],
                'data' => [
                    'created' => $created,
                    'updated' => $updated,
                    'errors' => $errors
                ]
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            SqlErrors::logError($e, $request);
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk item pricings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pricings by pricing set
     * GET /api/item-pricings/pricing-set/{pricingSetId}
     */
    public function getByPricingSet($pricingSetId)
    {
        try {
            $itemPricings = ItemPricings::with(['transactionItem'])
                ->where('nPricingSetId', $pricingSetId)
                ->orderBy('nTransactionItemId')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Item pricings retrieved successfully',
                'itemPricings' => $itemPricings
            ], 200);

        } catch (Exception $e) {
            SqlErrors::logError($e, request());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve item pricings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all pricings for a pricing set
     * DELETE /api/item-pricings/pricing-set/{pricingSetId}
     */
    public function deleteByPricingSet($pricingSetId)
    {
        try {
            DB::beginTransaction();

            $count = ItemPricings::where('nPricingSetId', $pricingSetId)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Item pricings deleted successfully',
                'deleted_count' => $count
            ], 200);

        } catch (Exception $e) {
            DB::rollBack();
            SqlErrors::logError($e, request());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item pricings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}