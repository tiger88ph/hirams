<?php

namespace App\Http\Controllers\Api;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\PricingSetService;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\PricingSet\StorePricingSetRequest;
use App\Http\Requests\PricingSet\UpdatePricingSetRequest;
use App\Helpers\FormulaHelper;
class PricingSetController extends Controller
{
    public function __construct(
        private PricingSetService $pricingSetService
    ) {}

    /**
     * Get all pricing sets with optional transaction filter
     * Query: nTransactionId
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $transactionId = $request->query('nTransactionId');
            $pricingSets = $this->pricingSetService->getAllPricingSets($transactionId);

            $this->appendPriceSetTable($pricingSets);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Pricing Sets']),
                'data' => $pricingSets,
            ], 200);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Pricing Sets');
        }
    }
    private function appendPriceSetTable($pricingSets)
    {
        //$pricingSets->each(function ($pricingSet) {
        //      $pricingSet->strName = 'hehecc';
        //    });

        foreach ($pricingSets as &$pricingSet) {
            $pricingSet->totalSellingPrice = FormulaHelper::calculateTotalSellingPrice($pricingSet->nPricingSetId); // Add a new property to the object
            // If it was an associative array: $row['last_name'] = 'Doe';
        }
    }

    /**
     * Create a new pricing set
     */
    public function store(StorePricingSetRequest $request): JsonResponse
    {
        try {
            $pricingSet = $this->pricingSetService->createPricingSet($request->validated());

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Pricing Set']),
                'data' => $pricingSet,
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
            $pricingSet = $this->pricingSetService->getPricingSetById($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Pricing Set']),
                'data' => $pricingSet,
            ], 200);
        } catch (ModelNotFoundException $e) {
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
    public function update(UpdatePricingSetRequest $request, int $id): JsonResponse
    {
        try {
            $pricingSet = $this->pricingSetService->updatePricingSet($id, $request->validated());

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Pricing Set']),
                'data' => $pricingSet,
            ], 200);
        } catch (ModelNotFoundException $e) {
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
            $pricingSet = $this->pricingSetService->deletePricingSet($id);

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Pricing Set']),
                'deleted_data' => $pricingSet,
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Pricing Set']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Pricing Set');
        }
    }

    /**
     * Toggle chosen status for a pricing set
     * Custom Action: PATCH /pricing-sets/{id}/choose
     */
    public function choose(int $id): JsonResponse
    {
        try {
            $pricingSet = $this->pricingSetService->toggleChosenStatus($id);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Pricing Set Status']),
                'data' => $pricingSet,
            ], 200);
        } catch (ModelNotFoundException $e) {
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
        $this->pricingSetService->logError($e->getMessage());

        return response()->json([
            'message' => __("messages.{$messageKey}", ['name' => $entityName]),
            'error' => $e->getMessage(),
        ], 500);
    }
}
