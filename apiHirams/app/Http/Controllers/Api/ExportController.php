<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function downloadTransactionExcel(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/transaction_temp.xlsx');
        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // 1️⃣ Put the title in C5
        $title = $request->input('title', '');
        $sheet->setCellValue('C5', $title);

        // 2️⃣ Items
        $items = $request->input('items', []);

        $row = 6;
        $count = 1;

        // Totals
        $totalEWT = 0;
        $totalPurchasePrice = 0;

        foreach ($items as $item) {

            // Find included option
            $includedOption = null;
            if (!empty($item['purchaseOptions'])) {
                foreach ($item['purchaseOptions'] as $option) {
                    if (!empty($option['bIncluded']) && $option['bIncluded'] == 1) {
                        $includedOption = $option;
                        break;
                    }
                }
            }

            // Safe values
            $qty = isset($item['qty']) ? floatval($item['qty']) : 0;
            $unitPrice = isset($includedOption['dUnitPrice']) ? floatval($includedOption['dUnitPrice']) : 0;
            $ewt = isset($includedOption['dEWT']) ? floatval($includedOption['dEWT']) : 0;

            // Computed purchase price
            $purchasePrice = $qty * $unitPrice;

            // Track totals
            $totalEWT += $ewt;
            $totalPurchasePrice += $purchasePrice;

            // Insert row
            $sheet->insertNewRowBefore($row, 1);

            $sheet->setCellValue("A{$row}", $count);
            $sheet->setCellValue("C{$row}", $item['name'] ?? '');
            $sheet->setCellValue("D{$row}", $qty);
            $sheet->setCellValue("E{$row}", $item['uom'] ?? '');

            $sheet->setCellValue("F{$row}", $includedOption['strBrand'] ?? '');
            $sheet->setCellValue("G{$row}", $includedOption['supplierNickName'] ?? '');
            $sheet->setCellValue("H{$row}", $ewt);
            $sheet->setCellValue("I{$row}", $unitPrice);
            $sheet->setCellValue("J{$row}", $purchasePrice);

            $row++;
            $count++;
        }

        // 3️⃣ After all items → leave 1 empty row
        $row++;

        // 4️⃣ Insert summary row
        $sheet->setCellValue("D{$row}", $count - 1);          // total items
        $sheet->setCellValue("H{$row}", $totalEWT);           // total EWT
        $sheet->setCellValue("J{$row}", $totalPurchasePrice); // total purchase price

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="transaction_export.xlsx"',
        ]);
    }
    public function exportBreakdown(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/transac-pricing.xlsx');
        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // ✅ Get items and unit selling prices from frontend
        $items = $request->input('items', []);
        $unitSellingPrices = $request->input('unitSellingPrices', []);
        $transactionHasABC = $request->input('transactionHasABC', false);
        $transactionABC = $request->input('transactionABC', 0);

        // ✅ Place TRANSACTION ABC into Excel cell P3
        $sheet->setCellValue('P3', $transactionABC);

        $row = 4; // Start at row 4
        $count = 1;

        // Totals
        $totalEWT = 0;
        $totalPurchasePrice = 0;
        $totalUnitSellingPrice = 0;
        $totalItemABC = 0;  // Sum of item ABCs only
        $totalDifference = 0;
        $totalProfit = 0;
        $totalTax = 0;
        $hasAnyItemABC = false;  // Track if any item has ABC

        foreach ($items as $item) {
            // Find included option
            $includedOption = null;
            $includedTotal = 0;

            if (!empty($item['purchaseOptions'])) {
                foreach ($item['purchaseOptions'] as $option) {
                    if (!empty($option['bIncluded']) && $option['bIncluded'] == 1) {
                        $includedOption = $option;
                        $optQty = isset($option['nQuantity']) ? floatval($option['nQuantity']) : 0;
                        $optPrice = isset($option['dUnitPrice']) ? floatval($option['dUnitPrice']) : 0;
                        $includedTotal += $optQty * $optPrice;
                    }
                }
            }

            // Safe values
            $qty = isset($item['qty']) ? floatval($item['qty']) : 0;
            $unitPrice = isset($includedOption['dUnitPrice']) ? floatval($includedOption['dUnitPrice']) : 0;
            $ewt = isset($includedOption['dEWT']) ? floatval($includedOption['dEWT']) : 0;

            // Computed purchase price (capital)
            $capital = $qty > 0 ? $includedTotal / $qty : 0;
            $purchasePrice = $includedTotal;

            // Get unit selling price from the map
            $itemId = $item['id'] ?? null;
            $unitSellingPrice = isset($unitSellingPrices[$itemId]) ? floatval($unitSellingPrices[$itemId]) : 0;

            // Total selling price
            $totalSellingPrice = $unitSellingPrice * $qty;

            // Check if item has its own ABC
            $itemABC = isset($item['abc']) ? floatval($item['abc']) : 0;
            $hasItemABC = $itemABC > 0;

            if ($hasItemABC) {
                $hasAnyItemABC = true;
            }

            // Tax: ((Total Selling - Purchases) / 1.12) × 0.42
            $tax = (($totalSellingPrice - $includedTotal) / 1.12) * 0.42;

            // Profit after tax
            $profit = (($unitSellingPrice - $capital) * $qty) - $tax;

            // Profit Margin Percentage: (Profit / Total Purchase Price) × 100
            $profitMarginPercentage = $purchasePrice > 0 ? ($profit / $purchasePrice) * 100 : 0;

            // Track totals
            $totalEWT += $ewt;
            $totalPurchasePrice += $purchasePrice;
            $totalUnitSellingPrice += $totalSellingPrice;
            $totalProfit += $profit;
            $totalTax += $tax;

            // Insert row if needed (after first item)
            if ($count > 1) {
                $sheet->insertNewRowBefore($row, 1);
            }

            // Populate cells
            $sheet->setCellValue("B{$row}", $count);                                    // Count
            $sheet->setCellValue("C{$row}", $item['name'] ?? '');                      // Item Name
            $sheet->setCellValue("E{$row}", $qty);                                     // Quantity
            $sheet->setCellValue("F{$row}", $item['uom'] ?? '');                       // Unit of Measurement
            $sheet->setCellValue("G{$row}", $includedOption['strBrand'] ?? '');        // Brand
            $sheet->setCellValue("H{$row}", $includedOption['supplierNickName'] ?? ''); // Supplier Nickname
            $sheet->setCellValue("I{$row}", $ewt);                                     // EWT
            $sheet->setCellValue("J{$row}", $capital);                                 // Unit Price (Capital)
            $sheet->setCellValue("K{$row}", $purchasePrice);                           // Total Price (Purchases)
            $sheet->setCellValue("M{$row}", $unitSellingPrice);                        // Unit Selling Price
            $sheet->setCellValue("N{$row}", $totalSellingPrice);                       // Total Selling Price

            // Only populate O and P if item HAS its own ABC
            if ($hasItemABC) {
                $difference = $itemABC - $totalSellingPrice;

                $sheet->setCellValue("O{$row}", $itemABC);                             // Item ABC
                $sheet->setCellValue("P{$row}", $qty > 0 ? $itemABC / $qty : 0);      // ABC per unit
                $sheet->setCellValue("Q{$row}", $difference);                          // Difference

                $totalItemABC += $itemABC;
                $totalDifference += $difference;
            } else {
                // Leave O and P empty if no item ABC
                $sheet->setCellValue("O{$row}", '');
                $sheet->setCellValue("P{$row}", '');
                // Q shows negative total selling price (0 - totalSellingPrice)
                $sheet->setCellValue("Q{$row}", -$totalSellingPrice);
                $totalDifference += -$totalSellingPrice;
            }

            $sheet->setCellValue("R{$row}", $profit);                                  // Profit
            $sheet->setCellValue("S{$row}", $tax);                                     // Tax
            $sheet->setCellValue("T{$row}", $profitMarginPercentage . '%');                  // Profit Margin %

            $row++;
            $count++;
        }

        // ✅ Skip one row
        $row++;

        // ✅ Determine which ABC to display in totals
        // If items have ABC values, use sum of item ABCs
        // Otherwise, use transaction ABC from P3
        $displayTotalABC = '';

        if ($hasAnyItemABC) {
            // Items have ABC - use sum of item ABCs
            $displayTotalABC = $totalItemABC;
        } elseif ($transactionHasABC && $transactionABC > 0) {
            // No item ABC but transaction has ABC - use transaction ABC
            $displayTotalABC = $transactionABC;
            // Recalculate total difference as transaction ABC - total selling price
            $totalDifference = $transactionABC - $totalUnitSellingPrice;
        }
        // ✅ Add totals row
        $sheet->setCellValue("B{$row}", 'TOTAL');
        $sheet->setCellValue("I{$row}", $totalEWT);                                    // Total EWT
        $sheet->setCellValue("K{$row}", $totalPurchasePrice);                          // Total Purchases
        $sheet->setCellValue("N{$row}", $totalUnitSellingPrice);                       // Total Selling Price

        // Show total ABC and difference
        if ($displayTotalABC !== '') {
            $sheet->setCellValue("P{$row}", $displayTotalABC);                         // Total ABC
        } else {
            $sheet->setCellValue("P{$row}", '');
        }

        // Q always shows total difference
        $sheet->setCellValue("Q{$row}", $totalDifference);                             // Total Difference

        $sheet->setCellValue("R{$row}", $totalProfit);                                 // Total Profit
        $sheet->setCellValue("S{$row}", $totalTax);                                    // Total Tax
        // Total Profit Margin %

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' =>
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' =>
            'attachment; filename="breakdown_export.xlsx"',
        ]);
    }
}
