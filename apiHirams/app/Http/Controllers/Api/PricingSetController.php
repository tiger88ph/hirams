<?php

namespace App\Http\Controllers\Api;

use App\Events\PricingSetUpdated;
use App\Helpers\FormulaHelper;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\ItemPricings;
use App\Models\PricingSet;
use App\Models\SqlErrors;
use App\Models\Transactions;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PricingSetController extends Controller
{
    /**
     * Get all pricing sets with optional transaction filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PricingSet::withCount('itemPricings');

            if ($transactionId = $request->query('nTransactionId')) {
                $query->where('nTransactionId', $transactionId);
            }

            $pricingSets = $query->orderByDesc('bChosen')
                ->orderByDesc('nPricingSetId')
                ->get();
            $this->appendPriceSetTable($pricingSets);
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Pricing Sets']),
                'data'    => $pricingSets,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Pricing Sets');
        }
    }

    private function appendPriceSetTable($pricingSets)
    {
        foreach ($pricingSets as &$pricingSet) {
            $transaction  = Transactions::with('transactionItems')->find($pricingSet->nTransactionId);
            $itemsWithABC = $transaction?->transactionItems->filter(fn($i) => $i->dUnitABC !== null) ?? collect();

            // $totalABC = $itemsWithABC->isNotEmpty()
            //     ? $itemsWithABC->sum('dUnitABC')
            //     : (float) ($transaction?->dTotalABC ?? 0);
            $totalABC = $transaction?->dTotalABC !== null
                ? (float) $transaction->dTotalABC
                : $itemsWithABC->sum('dUnitABC');
            $pricedCount = ItemPricings::where('nPricingSetId', $pricingSet->nPricingSetId)
                ->whereNotNull('dUnitSellingPrice')
                ->where('dUnitSellingPrice', '>', 0)
                ->count();

            $pricingSet->item = $pricedCount . '/' . ($transaction?->transactionItems->count() ?? 0);
            $pricingSet->totalSellingPrice = FormulaHelper::calculateTotalSellingPrice($pricingSet->nPricingSetId);
            $pricingSet->totalABC          = $totalABC;
            $pricingSet->diveAmount        = $totalABC - $pricingSet->totalSellingPrice;
            $pricingSet->divePercentage    = $totalABC > 0
                ? round(($pricingSet->diveAmount / $totalABC) * 100, 2) . '%'
                : '0.00%';
        }
    }
    /**
     * Create a new pricing set
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nTransactionId' => 'required|integer',
                'strName'        => 'required|string|max:255',
            ]);

            $pricingSet = PricingSet::create([
                'nTransactionId' => $validated['nTransactionId'],
                'strName'        => $validated['strName'],
            ]);
            broadcast(new PricingSetUpdated('created', $pricingSet->nPricingSetId, $pricingSet->nTransactionId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Pricing Set']),
                'data'    => $pricingSet,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Pricing Set');
        }
    }

    /**
     * Get a single pricing set by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $pricingSet = PricingSet::with('itemPricings')->findOrFail($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Pricing Set']),
                'data'    => $pricingSet,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Pricing Set']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Pricing Set');
        }
    }

    /**
     * Update an existing pricing set
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strName' => 'sometimes|required|string|max:255',
                'bChosen' => 'sometimes|boolean',
            ]);

            $pricingSet = PricingSet::findOrFail($id);
            $pricingSet->update($validated);
            broadcast(new PricingSetUpdated('updated', $pricingSet->nPricingSetId, $pricingSet->nTransactionId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Pricing Set']),
                'data'    => $pricingSet,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Pricing Set']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Pricing Set');
        }
    }

    /**
     * Delete a pricing set
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $pricingSet = PricingSet::findOrFail($id);
            $pricingSet->delete();
            broadcast(new PricingSetUpdated('deleted', $pricingSet->nPricingSetId, $pricingSet->nTransactionId))->toOthers();

            return response()->json([
                'message'      => __('messages.delete_success', ['name' => 'Pricing Set']),
                'deleted_data' => $pricingSet,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Pricing Set']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Pricing Set');
        }
    }

    /**
     * Toggle chosen status for a pricing set
     */
    public function choose(int $id): JsonResponse
    {
        try {
            $pricingSet = PricingSet::findOrFail($id);

            DB::transaction(function () use ($pricingSet) {
                if ($pricingSet->bChosen == 1) {
                    $pricingSet->update(['bChosen' => 0]);
                } else {
                    PricingSet::where('nTransactionId', $pricingSet->nTransactionId)
                        ->update(['bChosen' => 0]);
                    $pricingSet->update(['bChosen' => 1]);
                }
            });
            broadcast(new PricingSetUpdated('chosen', $pricingSet->nPricingSetId, $pricingSet->nTransactionId))->toOthers();
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Pricing Set Status']),
                'data'    => $pricingSet->fresh(),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Pricing Set']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Pricing Set Status');
        }
    }

    /**
     * Centralized exception handling
     */
    private function handleException(Exception $e, string $messageKey, string $entityName): JsonResponse
    {
        SqlErrors::create([
            'dtDate'   => TimeHelper::now(),
            'strError' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => __("messages.{$messageKey}", ['name' => $entityName]),
            'error'   => $e->getMessage(),
        ], 500);
    }
}
