<?php

namespace App\Http\Controllers\Api;

use App\Models\SqlErrors;
use Illuminate\Http\Request;
use App\Models\PurchaseOptions;
use App\Http\Controllers\Controller;

class PurchaseOptionsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $purchaseOptions = PurchaseOptions::all();

            return response()->json([
                'message' => 'Purchase options retrieved successfully.',
                'items' => $purchaseOptions
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching purchase options: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch purchase options.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate request data
            $data = $request->validate([
                'nTransactionItemId' => 'required|integer|exists:tbltransactionitems,nTransactionItemId',
                'nSupplierId'        => 'nullable|integer|exists:tblsuppliers,nSupplierId',
                'quantity'           => 'required|integer|min:1',
                'uom'                => 'required|string|max:10',
                'brand'              => 'nullable|string|max:255',
                'model'              => 'nullable|string|max:255',
                'specs'              => 'nullable|string|max:2000',
                'unitPrice'          => 'required|numeric|min:0',
                'ewt'                => 'nullable|numeric|min:0',
                'bIncluded'          => 'nullable|integer|in:0,1', // checkbox 0/1
            ]);

            $purchaseOption = PurchaseOptions::create([
                'nTransactionItemId' => $data['nTransactionItemId'],
                'nSupplierId'        => $data['nSupplierId'],
                'nQuantity'          => $data['quantity'],
                'strUOM'             => $data['uom'],
                'strBrand'           => $data['brand'] ?? null,
                'strModel'           => $data['model'] ?? null,
                'strSpecs'           => $data['specs'] ?? null,
                'dUnitPrice'         => $data['unitPrice'],
                'dEWT'               => $data['ewt'] ?? 0,
                'bIncluded'          => $data['bIncluded'] ?? 1, // default included
                'dtCanvass'          => now(),
            ]);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Purchase Option']),
                'item' => $purchaseOption
            ], 201);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating purchase option: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Purchase Option']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $purchaseOption = PurchaseOptions::findOrFail($id);

            return response()->json([
                'message' => 'Purchase option retrieved successfully.',
                'item' => $purchaseOption
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase option.',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $purchaseOption = PurchaseOptions::findOrFail($id);

            $data = $request->validate([
                'nSupplierId' => 'nullable|integer|exists:tblsuppliers,nSupplierId',
                'quantity'    => 'nullable|integer|min:1',
                'uom'         => 'nullable|string|max:10',
                'brand'       => 'nullable|string|max:255',
                'model'       => 'nullable|string|max:255',
                'specs'       => 'nullable|string|max:2000',
                'unitPrice'   => 'nullable|numeric|min:0',
                'ewt'         => 'nullable|numeric|min:0',
                'bIncluded'   => 'nullable|integer|in:0,1', // checkbox 0/1
            ]);

            $purchaseOption->update([
                'nSupplierId' => $data['nSupplierId'] ?? $purchaseOption->nSupplierId,
                'nQuantity'   => $data['quantity'] ?? $purchaseOption->nQuantity,
                'strUOM'      => $data['uom'] ?? $purchaseOption->strUOM,
                'strBrand'    => $data['brand'] ?? $purchaseOption->strBrand,
                'strModel'    => $data['model'] ?? $purchaseOption->strModel,
                'strSpecs'    => $data['specs'] ?? $purchaseOption->strSpecs,
                'dUnitPrice'  => $data['unitPrice'] ?? $purchaseOption->dUnitPrice,
                'dEWT'        => $data['ewt'] ?? $purchaseOption->dEWT,
                'bIncluded'   => $data['bIncluded'] ?? $purchaseOption->bIncluded,
            ]);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Purchase Option']),
                'item' => $purchaseOption
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating purchase option: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Purchase Option']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $purchaseOption = PurchaseOptions::findOrFail($id);
            $purchaseOption->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Purchase Option']),
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error deleting purchase option: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Purchase Option']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getByItem($itemId)
    {
        try {
            $options = PurchaseOptions::with('supplier')
                ->where('nTransactionItemId', $itemId)
                ->get()
                ->map(function ($option) {
                    return [
                        'id' => $option->nPurchaseOptionId,
                        'nPurchaseOptionId' => $option->nPurchaseOptionId,
                        'nTransactionItemId' => $option->nTransactionItemId,
                        'nSupplierId' => $option->nSupplierId,
                        'supplierName' => $option->supplier?->strSupplierName ?? null,
                        'nQuantity' => $option->nQuantity,
                        'strUOM' => $option->strUOM,
                        'strBrand' => $option->strBrand,
                        'strModel' => $option->strModel,
                        'strSpecs' => $option->strSpecs,
                        'dUnitPrice' => $option->dUnitPrice,
                        'dEWT' => $option->dEWT,
                        'strProductCode' => $option->strProductCode,
                        'bIncluded' => (bool)$option->bIncluded,
                        'dtCanvass' => $option->dtCanvass,
                    ];
                });

            return response()->json([
                'message' => 'Purchase options retrieved successfully',
                'purchaseOptions' => $options
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase options',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
