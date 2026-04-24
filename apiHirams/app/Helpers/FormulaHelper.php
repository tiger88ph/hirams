<?php

namespace App\Helpers;

use App\Models\ItemPricings;
use App\Models\PurchaseOptions;
use App\Models\Supplier;
use App\Models\TransactionItems;

class FormulaHelper
{
    /**
     * Compute suggestive price: item unit ABC / sum of included (non-add-on) qty
     */
    public static function calculateSuggestivePrice(int $transactionItemId): float
    {
        $item = \App\Models\TransactionItems::find($transactionItemId);

        if (!$item) return 0;

        $sumIncludedQty = PurchaseOptions::where('nTransactionItemId', $transactionItemId)
            ->where('bIncluded', 1)
            ->where('bAddOn', 0)
            ->sum('nQuantity');

        if (!$sumIncludedQty) return 0;
        return round($item->dUnitABC / $sumIncludedQty, 4);
    }
    /**
     * Compute Item Tax: (total selling price - total purchase price) / 1.12 * (0.12 + 0.3)
     * total selling price = dUnitSellingPrice * nQuantity (from tblTransactionItems)
     * total purchase price = sum of (dUnitPrice * nQuantity) for bIncluded = 1 purchase options
     */
    // public static function calculateTax(int $transactionItemId, int $pricingSetId): float
    // {
    //     $transactionItem = TransactionItems::find($transactionItemId);
    //     if (!$transactionItem) return 0;

    //     $itemPricing = ItemPricings::where('nTransactionItemId', $transactionItemId)
    //         ->where('nPricingSetId', $pricingSetId)
    //         ->first();

    //     if (!$itemPricing || !$itemPricing->dUnitSellingPrice) return 0;

    //     $totalSellingPrice = $itemPricing->dUnitSellingPrice * $transactionItem->nQuantity;

    //     $purchaseOptions = PurchaseOptions::where('nTransactionItemId', $transactionItemId)
    //         ->where('bIncluded', 1)
    //         ->get();

    //     $totalPurchasePrice = $purchaseOptions->sum(fn($option) => $option->dUnitPrice * $option->nQuantity);

    //     return round(($totalSellingPrice - $totalPurchasePrice) / 1.12 * (0.12 + 0.3), 2);
    // }
    public static function calculateTax(int $transactionItemId, int $pricingSetId, ?float $overrideUnitSellingPrice = null): float
    {
        $transactionItem = TransactionItems::find($transactionItemId);
        if (!$transactionItem) return 0;

        // Use the override price if provided (e.g. live/unsaved price from frontend)
        // Otherwise fall back to the saved price in the database
        if ($overrideUnitSellingPrice !== null) {
            $unitSellingPrice = $overrideUnitSellingPrice;
        } else {
            $itemPricing = ItemPricings::where('nTransactionItemId', $transactionItemId)
                ->where('nPricingSetId', $pricingSetId)
                ->first();

            if (!$itemPricing || !$itemPricing->dUnitSellingPrice) return 0;

            $unitSellingPrice = (float) $itemPricing->dUnitSellingPrice;
        }

        $totalSellingPrice = $unitSellingPrice * $transactionItem->nQuantity;

        $purchaseOptions = PurchaseOptions::where('nTransactionItemId', $transactionItemId)
            ->where('bIncluded', 1)
            ->get();

        $totalPurchasePrice = $purchaseOptions->sum(fn($option) => $option->dUnitPrice * $option->nQuantity);

        return round(($totalSellingPrice - $totalPurchasePrice) / 1.12 * (0.12 + 0.3), 2);
    }
    /**
     * Compute total selling price: sum of dUnitSellingPrice from tblitemPricings for a given pricing set
     */
    public static function calculateTotalSellingPrice(int $pricingSetId): float
    {
        return (float) ItemPricings::where('nPricingSetId', $pricingSetId)
            ->join('tbltransactionitems', 'tbltransactionitems.nTransactionItemId', '=', 'tblitempricings.nTransactionItemId')
            ->selectRaw('SUM(tblitempricings.dUnitSellingPrice * tbltransactionitems.nQuantity) as total')
            ->value('total') ?? 0.0;
    }
    /**
     * Compute EWT (Expanded Withholding Tax)
     * - If supplier is not EWT-applicable (bEWT != 1) → return 0
     * - If cItemType === 'G' (Goods) → rate = 0.01 (1%)
     * - If cItemType === 'S' (Service) → rate = 0.02 (2%)
     * - If supplier has VAT (bVAT = 1) → base = totalCost / 1.12
     * - If supplier has no VAT → base = totalCost
     * - EWT = base * rate
     */
    public static function calculateEWT(
        float $quantity,
        float $unitPrice,
        Supplier $supplier,
        string $cItemType
    ): float {
        $totalCost = $quantity * $unitPrice;

        // If supplier is not EWT-applicable → no computation needed
        if ((int) $supplier->bEWT !== 1) return 0;

        // Determine rate based on item type
        // G = Goods → 1% (0.01), S = Service → 2% (0.02)
        $rate = $cItemType === 'G' ? 0.01 : 0.02;

        // Determine base amount
        // If supplier has VAT → compute on net amount (gross / 1.12)
        // If supplier has no VAT → compute on full gross amount
        $baseAmount = (int) $supplier->bVAT === 1 ? $totalCost / 1.12 : $totalCost;

        // Final EWT calculation
        $calculatedEWT = $baseAmount * $rate;

        return round($calculatedEWT, 2);
    }
}
