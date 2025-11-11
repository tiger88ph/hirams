<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\TransactionItems;
use App\Models\SqlErrors;
class TransactionItemsController extends Controller
{
    // showing all data
    public function index() {}
    // In TransactionItemsController.php
    public function getItemsByTransaction($transactionId)
    {
        try {
            $items = TransactionItems::with([
                'itemPricings.pricingSet',
                'purchaseOptions.supplier' // <-- eager load supplier
            ])
                ->where('nTransactionId', $transactionId)
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
                                'nPurchaseOptionId' => $option->nPurchaseOptionId,
                                'nTransactionItemId' => $option->nTransactionItemId,
                                'nSupplierId' => $option->nSupplierId,
                                'supplierName' => $option->supplier?->strSupplierName ?? null, // <-- added
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
    // inserting of data
    public function store(Request $request) {}
    // updating of data
    public function update(Request $request, $id) {}
    // showing data separately
    public function show() {}
    // deleting of data 
    public function destroy(string $id) {}
}
