<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TransactionItems;
use App\Models\SqlErrors;
use Exception;
class TransactionItemsController extends Controller
{
    // Show all transaction items
    public function index()
    {
        try {
            $items = TransactionItems::all();
            return response()->json([
                'message' => 'Transaction items retrieved successfully',
                'items' => $items
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching all transaction items: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to retrieve transaction items',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Create a new transaction item
    public function store(Request $request)
    {
        $request->validate([
            'nTransactionId' => 'required|integer',
            'strName' => 'required|string|max:255',
            'nQuantity' => 'required|integer',
            'strUOM' => 'nullable|string|max:50',
            'strSpecs' => 'nullable|string|max:20000',
            'dUnitABC' => 'required|numeric',
        ]);
        try {
            // Get the current max nItemNumber for this transaction
            $maxItemNumber = TransactionItems::where('nTransactionId', $request->nTransactionId)
                ->max('nItemNumber');
            $nextItemNumber = $maxItemNumber ? $maxItemNumber + 1 : 1;
            $item = TransactionItems::create(array_merge($request->all(), [
                'nItemNumber' => $nextItemNumber
            ]));
            return response()->json([
                'message' => 'Transaction item created successfully',
                'item' => $item
            ], 201);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating transaction item: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to create transaction item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Show a single transaction item
    public function show($id)
    {
        try {
            $item = TransactionItems::findOrFail($id);
            return response()->json([
                'message' => 'Transaction item retrieved successfully',
                'item' => $item
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching transaction item: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Transaction item not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }
    // Update a transaction item
    public function update(Request $request, $id)
    {
        $request->validate([
            'nTransactionId' => 'required|integer',
            'strName' => 'required|string|max:255',
            'nQuantity' => 'required|integer',
            'strUOM' => 'nullable|string|max:50',
            'strSpecs' => 'nullable|string|max:20000',
            'dUnitABC' => 'required|numeric',
        ]);
        try {
            $item = TransactionItems::findOrFail($id);
            $item->update($request->all());
            return response()->json([
                'message' => 'Transaction item updated successfully',
                'item' => $item
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating transaction item: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to update transaction item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Delete a transaction item
    public function destroy($id)
    {
        try {
            $item = TransactionItems::findOrFail($id);
            $item->delete();
            return response()->json([
                'message' => 'Transaction item deleted successfully'
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error deleting transaction item: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to delete transaction item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Get items by transaction
    public function getItemsByTransaction($transactionId)
    {
        try {
            // Get transaction first to access cItemType
            $transaction = \App\Models\Transactions::findOrFail($transactionId);
            $items = TransactionItems::with([
                'itemPricings.pricingSet',
                'purchaseOptions.supplier' // eager load supplier
            ])
                ->where('nTransactionId', $transactionId)
                ->orderBy('nItemNumber')
                ->get()
                ->map(function ($item) {
                    $firstPricing = $item->itemPricings->first();
                    $purchasePrice = $item->purchaseOptions
                        ->where('bIncluded', 1)
                        ->sortBy('dUnitPrice')
                        ->first()?->dUnitPrice ?? 0;
                    return [
                        'id' => $item->nTransactionItemId,
                        'nTransactionItemId' => $item->nTransactionItemId,
                        'nItemNumber' => $item->nItemNumber,
                        'name' => $item->strName,
                        'qty' => $item->nQuantity,
                        'abc' => $item->dUnitABC,
                        'uom' => $item->strUOM,
                        'specs' => $item->strSpecs,
                        'purchasePrice' => $purchasePrice,
                        'sellingPrice' => $firstPricing?->dUnitSellingPrice ?? 0,
                        'pricingSet' => $firstPricing?->pricingSet?->strName ?? null,
                        'purchaseOptions' => $item->purchaseOptions->map(function ($option) {
                            return [
                                'id' => $option->nPurchaseOptionId,
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
                        }),
                    ];
                });
            return response()->json([
                'message' => 'Transaction items retrieved successfully',
                'cItemType' => $transaction->cItemType, // Include cItemType here
                'items' => $items
            ], 200);
        } catch (\Exception $e) {
            \App\Models\SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching transaction items: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to retrieve transaction items',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    // Update item order (nItemNumber) after drag & drop
    public function updateOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.nItemNumber' => 'required|integer',
        ]);
        try {
            foreach ($request->items as $item) {
                $transactionItem = TransactionItems::findOrFail($item['id']);
                $transactionItem->nItemNumber = $item['nItemNumber'];
                $transactionItem->save();
            }
            return response()->json([
                'message' => 'Item order updated successfully',
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating transaction item order: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to update item order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
