<?php

namespace App\Http\Controllers\Api;

use App\Events\OptionUpdated;
use App\Helpers\FormulaHelper;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOptions;
use App\Models\SqlErrors;
use App\Models\Supplier;
use App\Models\TransactionItems;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOptionsController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $purchaseOptions = PurchaseOptions::all();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Purchase options']),
                'items'   => $purchaseOptions,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Purchase options');
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nTransactionItemId' => 'required|integer|exists:tbltransactionitems,nTransactionItemId',
                'nSupplierId'        => 'nullable|integer|exists:tblsuppliers,nSupplierId',
                'quantity'           => 'required|integer|min:1',
                'uom'                => 'required|string|max:10',
                'brand'              => 'nullable|string|max:255',
                'model'              => 'nullable|string|max:255',
                'specs'              => 'nullable|string|max:20000',
                'unitPrice'          => 'required|numeric|min:0',
                'ewt'                => 'nullable|numeric|min:0',
                'bIncluded'          => 'nullable|integer|in:0,1',
                'bAddOn'             => 'nullable|integer|in:0,1',
            ]);

            $purchaseOption = PurchaseOptions::create([
                'nTransactionItemId' => $validated['nTransactionItemId'],
                'nSupplierId'        => $validated['nSupplierId'] ?? null,
                'nQuantity'          => $validated['quantity'],
                'strUOM'             => $validated['uom'],
                'strBrand'           => $validated['brand'] ?? null,
                'strModel'           => $validated['model'] ?? null,
                'strSpecs'           => $validated['specs'] ?? null,
                'dUnitPrice'         => $validated['unitPrice'],
                'dEWT'               => $validated['ewt'] ?? 0,
                'bIncluded'          => $validated['bIncluded'] ?? 1,
                'bAddOn'             => $validated['bAddOn'] ?? 0,
                'dtCanvass'          => TimeHelper::now(),
            ]);

            $item = TransactionItems::findOrFail($validated['nTransactionItemId']);
            broadcast(new OptionUpdated('created', $purchaseOption->nPurchaseOptionId, $item->nTransactionItemId, $item->nTransactionId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Purchase Option']),
                'item'    => $purchaseOption,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Purchase Option');
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $purchaseOption = PurchaseOptions::findOrFail($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Purchase option']),
                'item'    => $purchaseOption,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Purchase option']),
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Purchase option');
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId' => 'nullable|integer|exists:tblsuppliers,nSupplierId',
                'quantity'    => 'nullable|integer|min:1',
                'uom'         => 'nullable|string|max:10',
                'brand'       => 'nullable|string|max:255',
                'model'       => 'nullable|string|max:255',
                'specs'       => 'nullable|string|max:20000',
                'unitPrice'   => 'nullable|numeric|min:0',
                'ewt'         => 'nullable|numeric|min:0',
                'bIncluded'   => 'nullable|integer|in:0,1',
                'bAddOn'      => 'nullable|integer|in:0,1',
            ]);

            $purchaseOption = PurchaseOptions::findOrFail($id);

            $purchaseOption->update([
                'nSupplierId' => $validated['nSupplierId'] ?? $purchaseOption->nSupplierId,
                'nQuantity'   => $validated['quantity']    ?? $purchaseOption->nQuantity,
                'strUOM'      => $validated['uom']         ?? $purchaseOption->strUOM,
                'strBrand'    => $validated['brand']       ?? $purchaseOption->strBrand,
                'strModel'    => $validated['model']       ?? $purchaseOption->strModel,
                'strSpecs'    => $validated['specs']       ?? $purchaseOption->strSpecs,
                'dUnitPrice'  => $validated['unitPrice']   ?? $purchaseOption->dUnitPrice,
                'dEWT'        => $validated['ewt']         ?? $purchaseOption->dEWT,
                'bIncluded'   => $validated['bIncluded']   ?? $purchaseOption->bIncluded,
                'bAddOn'      => $validated['bAddOn']      ?? $purchaseOption->bAddOn,
            ]);
            $item = TransactionItems::findOrFail($purchaseOption->nTransactionItemId);
            broadcast(new OptionUpdated('updated', $purchaseOption->nPurchaseOptionId, $item->nTransactionItemId, $item->nTransactionId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Purchase Option']),
                'item'    => $purchaseOption,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Purchase option']),
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Purchase Option');
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $option = PurchaseOptions::findOrFail($id);
            $item = TransactionItems::findOrFail($option->nTransactionItemId);
            $option->delete();
            broadcast(new OptionUpdated('deleted', $id, $item->nTransactionItemId, $item->nTransactionId))->toOthers();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Purchase Option']),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Purchase option']),
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Purchase Option');
        }
    }

    public function getByItem(int $itemId): JsonResponse
    {
        try {
            $options = PurchaseOptions::with('supplier')
                ->where('nTransactionItemId', $itemId)
                ->orderBy('bAddOn', 'asc')
                ->orderBy('bIncluded', 'desc')
                ->get()
                ->map(fn($option) => $this->formatOption($option));

            return response()->json([
                'message'         => __('messages.retrieve_success', ['name' => 'Purchase options']),
                'purchaseOptions' => $options,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Purchase options');
        }
    }

    public function getAddOnsByItem(int $itemId): JsonResponse
    {
        try {
            $options = PurchaseOptions::with('supplier')
                ->where('nTransactionItemId', $itemId)
                ->where('bAddOn', 1)
                ->get()
                ->map(fn($option) => $this->formatOption($option));

            return response()->json([
                'message'         => __('messages.retrieve_success', ['name' => 'Purchase options']),
                'purchaseOptions' => $options,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Purchase options');
        }
    }

    public function updateSpecs(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'specs' => 'nullable|string|max:20000',
            ]);

            $purchaseOption = PurchaseOptions::findOrFail($id);
            $purchaseOption->update([
                'strSpecs' => $validated['specs'] ?? $purchaseOption->strSpecs,
            ]);
            $item = TransactionItems::findOrFail($purchaseOption->nTransactionItemId);
            broadcast(new OptionUpdated('specs_updated', $purchaseOption->nPurchaseOptionId, $item->nTransactionItemId, $item->nTransactionId))->toOthers();
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Purchase Option']),
                'item'    => $purchaseOption,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Purchase option']),
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Purchase Option specs');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function formatOption($option): array
    {
        return [
            'id'                 => $option->nPurchaseOptionId,
            'nPurchaseOptionId'  => $option->nPurchaseOptionId,
            'nTransactionItemId' => $option->nTransactionItemId,
            'nSupplierId'        => $option->nSupplierId,
            'supplierName'       => $option->supplier?->strSupplierName ?? null,
            'supplierNickName'   => $option->supplier?->strSupplierNickName ?? null,
            'nQuantity'          => $option->nQuantity,
            'strUOM'             => $option->strUOM,
            'strBrand'           => $option->strBrand,
            'strModel'           => $option->strModel,
            'strSpecs'           => $option->strSpecs,
            'dUnitPrice'         => $option->dUnitPrice,
            'dEWT'               => $option->dEWT,
            'strProductCode'     => $option->strProductCode,
            'bIncluded'          => (bool) $option->bIncluded,
            'bAddOn'             => (bool) $option->bAddOn,
            'dtCanvass'          => $option->dtCanvass,
        ];
    }

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
    public function calculateEWT(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId' => 'required|integer|exists:tblsuppliers,nSupplierId',
                'quantity'    => 'required|numeric|min:0',
                'unitPrice'   => 'required|numeric|min:0',
                'cItemType'   => 'required|string|in:G,S',
            ]);

            $supplier = Supplier::findOrFail($validated['nSupplierId']);

            $calculatedEWT = FormulaHelper::calculateEWT(
                $validated['quantity'],
                $validated['unitPrice'],
                $supplier,
                $validated['cItemType']
            );

            // In PurchaseOptionsController::calculateEWT()
            return response()->json([
                'message'       => __('messages.retrieve_success', ['name' => 'EWT']),
                'calculatedEWT' => $calculatedEWT,  // fix the typo here
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'EWT');
        }
    }


public function getSuggestions(Request $request): JsonResponse
{
    try {
        $validated = $request->validate([
            'clientId'   => 'nullable|integer',
            'search'     => 'required|string|min:1|max:255',
            'supplierId' => 'nullable|integer|exists:tblsuppliers,nSupplierId',
        ]);
 
        $search     = trim($validated['search']);
        $supplierId = $validated['supplierId'] ?? null;
 
        $query = PurchaseOptions::with('supplier')
            ->where(function ($q) use ($search) {
                $q->where('strBrand', 'LIKE', "%{$search}%")
                  ->orWhere('strModel', 'LIKE', "%{$search}%");
            });
 
        // Hard-filter to the selected supplier when one is provided
        if ($supplierId) {
            $query->where('nSupplierId', $supplierId);
        }
 
        $suggestions = $query
            ->orderBy('dtCanvass', 'desc')   // most recent first
            ->limit(10)
            ->get()
            ->map(fn($option) => [
                'brand'        => $option->strBrand,
                'model'        => $option->strModel,
                'nSupplierId'  => $option->nSupplierId,
                'supplierName' => $option->supplier?->strSupplierName ?? null,
                'supplierNickName' => $option->supplier?->strSupplierNickName ?? null,
                'quantity'     => $option->nQuantity,
                'uom'          => $option->strUOM,
                'unitPrice'    => $option->dUnitPrice,
                'ewt'          => $option->dEWT,
                'specs'        => $option->strSpecs,
            ])
            // Deduplicate by brand+model+supplierId combo
            ->unique(fn($s) => implode('|', [$s['brand'], $s['model'], $s['nSupplierId']]))
            ->values();
 
        return response()->json([
            'message'     => __('messages.retrieve_success', ['name' => 'Purchase option suggestions']),
            'suggestions' => $suggestions,
        ]);
    } catch (Exception $e) {
        return $this->handleException($e, 'retrieve_failed', 'Purchase option suggestions');
    }
}
}
