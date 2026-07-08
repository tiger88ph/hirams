<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Writer\Html;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

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

            // Find included non-addOn option (for brand, supplier, unit price)
            $includedOption = null;
            // EWT = sum of dEWT from ALL included options (addOn or not)
            $ewt = 0;

            if (!empty($item['purchaseOptions'])) {
                foreach ($item['purchaseOptions'] as $option) {
                    if (!empty($option['bIncluded']) && $option['bIncluded'] == 1) {
                        // Sum EWT from all included options
                        $ewt += isset($option['dEWT']) ? floatval($option['dEWT']) : 0;

                        // Only use non-addOn option for brand/supplier/unit price
                        if (empty($option['bAddOn']) || $option['bAddOn'] == 0) {
                            $includedOption = $option;
                        }
                    }
                }
            }

            // Safe values
            $qty = isset($item['qty']) ? floatval($item['qty']) : 0;
            $unitPrice = isset($includedOption['dUnitPrice']) ? floatval($includedOption['dUnitPrice']) : 0;

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

        // ✅ Get inputs from frontend
        $items             = $request->input('items', []);
        $unitSellingPrices = $request->input('unitSellingPrices', []);
        $transactionHasABC = $request->input('transactionHasABC', false);
        $transactionABC    = $request->input('transactionABC', 0);
        $directCosts       = $request->input('directCosts', []);
        $directCostOptions = $request->input('directCostOptions', []);
        $editableValues    = $request->input('editableValues', []);
        $deliveryDays      = $request->input('deliveryDays');
        $deliveryPlace     = $request->input('deliveryPlace');
        $createdBy     = $request->input('createdBy');

        // ✅ Build option name lookup map: optionId => strName
        $optionNameMap = [];
        foreach ($directCostOptions as $option) {
            $id   = $option['nDirectCostOptionID'] ?? $option['id'] ?? null;
            $name = $option['strName'] ?? $option['name'] ?? '';
            if ($id !== null) {
                $optionNameMap[$id] = $name;
            }
        }

        // ✅ Place TRANSACTION ABC into Excel cell P3 (above items, safe)
        $sheet->setCellValue('P3', $transactionABC);

        $row   = 4; // Start at row 4
        $count = 1;

        // Totals
        $totalEWT              = 0;
        $totalPurchasePrice    = 0;
        $totalUnitSellingPrice = 0;
        $totalItemABC          = 0;
        $totalDifference       = 0;
        $totalProfit           = 0;
        $totalTax              = 0;
        $hasAnyItemABC         = false;

        foreach ($items as $item) {
            $includedOption = null;
            $includedTotal  = 0;
            $ewt            = 0;

            if (!empty($item['purchaseOptions'])) {
                foreach ($item['purchaseOptions'] as $option) {
                    if (!empty($option['bIncluded']) && $option['bIncluded'] == 1) {
                        $optQty   = isset($option['nQuantity']) ? floatval($option['nQuantity']) : 0;
                        $optPrice = isset($option['dUnitPrice']) ? floatval($option['dUnitPrice']) : 0;
                        $includedTotal += $optQty * $optPrice;

                        $ewt += isset($option['dEWT']) ? floatval($option['dEWT']) : 0;

                        if (empty($option['bAddOn']) || $option['bAddOn'] == 0) {
                            $includedOption = $option;
                        }
                    }
                }
            }

            $qty           = isset($item['qty']) ? floatval($item['qty']) : 0;
            $capital       = $qty > 0 ? $includedTotal / $qty : 0;
            $purchasePrice = $includedTotal;

            $itemId            = $item['id'] ?? null;
            $unitSellingPrice  = isset($unitSellingPrices[$itemId]) ? floatval($unitSellingPrices[$itemId]) : 0;
            $totalSellingPrice = $unitSellingPrice * $qty;

            $itemABC    = isset($item['abc']) ? floatval($item['abc']) : 0;
            $hasItemABC = $itemABC > 0;

            if ($hasItemABC) {
                $hasAnyItemABC = true;
            }

            $tax    = (($totalSellingPrice - $includedTotal) / 1.12) * 0.42;
            $profit = (($unitSellingPrice - $capital) * $qty) - $tax;

            $profitMarginPercentage = $purchasePrice > 0
                ? round(($profit / $purchasePrice) * 100, 2)
                : 0;

            $totalEWT              += $ewt;
            $totalPurchasePrice    += $purchasePrice;
            $totalUnitSellingPrice += $totalSellingPrice;
            $totalProfit           += $profit;
            $totalTax              += $tax;

            if ($count > 1) {
                $sheet->insertNewRowBefore($row, 1);
            }

            $sheet->setCellValue("B{$row}", $count);
            $sheet->setCellValue("C{$row}", $item['name'] ?? '');
            $sheet->setCellValue("E{$row}", $qty);
            $sheet->setCellValue("F{$row}", $item['uom'] ?? '');
            $sheet->setCellValue("G{$row}", $includedOption['strBrand'] ?? '');
            $sheet->setCellValue("H{$row}", $includedOption['supplierNickName'] ?? '');
            $sheet->setCellValue("I{$row}", $ewt);
            $sheet->setCellValue("J{$row}", $capital);
            $sheet->setCellValue("K{$row}", $purchasePrice);
            $sheet->setCellValue("M{$row}", $unitSellingPrice);
            $sheet->setCellValue("N{$row}", $totalSellingPrice);

            if ($hasItemABC) {
                $difference = $itemABC - $totalSellingPrice;

                $sheet->setCellValue("O{$row}", $itemABC);
                $sheet->setCellValue("P{$row}", $qty > 0 ? $itemABC / $qty : 0);
                $sheet->setCellValue("Q{$row}", $difference);

                $totalItemABC    += $itemABC;
                $totalDifference += $difference;
            } else {
                $sheet->setCellValue("O{$row}", '');
                $sheet->setCellValue("P{$row}", '');
                $sheet->setCellValue("Q{$row}", -$totalSellingPrice);
                $totalDifference += -$totalSellingPrice;
            }

            $sheet->setCellValue("R{$row}", $profit);
            $sheet->setCellValue("S{$row}", $tax);
            $sheet->setCellValue("T{$row}", number_format($profitMarginPercentage, 2) . '%');

            $row++;
            $count++;
        }

        // ✅ Skip one row
        $row++;

        // ✅ How many extra rows were inserted (first item doesn't insert)
        $insertedRows = max(0, $count - 2);

        // ✅ Now write delivery info with offset
        $sheet->setCellValue('D' . (9  + $insertedRows), $deliveryDays);
        $sheet->setCellValue('D' . (10 + $insertedRows), $deliveryPlace);
        $sheet->setCellValue('D' . (12 + $insertedRows), $createdBy);
        // ✅ Keyword-to-cell mapping with offset applied
        $keywordCellMap = [
            'lat'  => 'K' . (17 + $insertedRows),
            'ret'  => 'K' . (24 + $insertedRows),
            'bid'  => 'K' . (30 + $insertedRows),
            'fee'  => 'K' . (31 + $insertedRows),
            'frei' => 'K' . (32 + $insertedRows),
            'del'  => 'K' . (33 + $insertedRows),
            'war'  => 'K' . (34 + $insertedRows),
            'man'  => 'K' . (35 + $insertedRows),
            'reb'  => 'K' . (36 + $insertedRows),
        ];

        // ✅ Accumulate amounts per keyword from directCosts
        $keywordTotals = array_fill_keys(array_keys($keywordCellMap), 0);

        foreach ($directCosts as $cost) {
            $optionId = $cost['nDirectCostOptionID'] ?? null;
            $strName  = strtolower(trim($optionNameMap[$optionId] ?? ''));
            $amount   = floatval($cost['dAmount'] ?? 0);

            foreach ($keywordCellMap as $keyword => $cell) {
                if (str_contains($strName, $keyword)) {
                    $keywordTotals[$keyword] += $amount;
                    break;
                }
            }
        }

        // ✅ Write all keyword totals to their offset cells
        foreach ($keywordCellMap as $keyword => $cell) {
            if ($keywordTotals[$keyword] > 0) {
                $sheet->setCellValue($cell, $keywordTotals[$keyword]);
            }
        }

        // ✅ Determine which ABC to display in totals
        $displayTotalABC = '';

        if ($hasAnyItemABC) {
            $displayTotalABC = $totalItemABC;
        } elseif ($transactionHasABC && $transactionABC > 0) {
            $displayTotalABC = $transactionABC;
            $totalDifference = $transactionABC - $totalUnitSellingPrice;
        }

        // ✅ Add totals row
        $sheet->setCellValue("B{$row}", 'TOTAL');
        $sheet->setCellValue("I{$row}", $totalEWT);
        $sheet->setCellValue("K{$row}", $totalPurchasePrice);
        $sheet->setCellValue("N{$row}", $totalUnitSellingPrice);

        if ($displayTotalABC !== '') {
            $sheet->setCellValue("P{$row}", $displayTotalABC);
        } else {
            $sheet->setCellValue("P{$row}", '');
        }

        $sheet->setCellValue("Q{$row}", $totalDifference);
        $sheet->setCellValue("R{$row}", $totalProfit);
        $sheet->setCellValue("S{$row}", $totalTax);

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
    public function exportSellingPriceReport(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/SellingPriceReportTemplate.xlsx');
        $spreadsheet  = IOFactory::load($templatePath);
        $sheet        = $spreadsheet->getActiveSheet();

        $transaction       = $request->input('transaction', []);
        $items             = $request->input('items', []);
        $unitSellingPrices = $request->input('unitSellingPrices', []);

        // ── Header ────────────────────────────────────────────────
        $sheet->setCellValue("C2", $transaction['client']['strClientName'] ?? '--');
        $sheet->setCellValue("C3", $transaction['strTitle']                ?? '--');
        $sheet->setCellValue("G2", $transaction['strCode']                 ?? '--');

        // ── Items ─────────────────────────────────────────────────
        $row        = 6;
        $count      = 1;
        $grandTotal = 0;

        foreach ($items as $item) {
            $includedOption = null;
            foreach ($item['purchaseOptions'] ?? [] as $option) {
                if (!empty($option['bIncluded']) && $option['bIncluded'] == 1) {
                    if (empty($option['bAddOn']) || $option['bAddOn'] == 0) {
                        $includedOption = $option;
                        break;
                    }
                }
            }

            $qty              = floatval($item['qty'] ?? 0);
            $itemId           = $item['id'] ?? null;
            $unitSellingPrice = floatval($unitSellingPrices[$itemId] ?? 0);
            $totalSelling     = $unitSellingPrice * $qty;
            $grandTotal      += $totalSelling;

            $brand      = $includedOption['strBrand'] ?? '';
            $model      = $includedOption['strModel'] ?? '';
            $brandModel = trim(implode(' - ', array_filter([$brand, $model])));

            if ($count > 1) {
                $sheet->insertNewRowBefore($row, 1);
            }

            $sheet->setCellValue("B{$row}", $count);
            $sheet->getStyle("B{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            $sheet->setCellValue("C{$row}", $item['name'] ?? '');
            $sheet->getStyle("C{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            $sheet->setCellValue("D{$row}", $brandModel);
            $sheet->getStyle("D{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            $sheet->setCellValue("E{$row}", $qty);
            $sheet->getStyle("E{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            $sheet->setCellValue("F{$row}", '₱ ' . number_format($unitSellingPrice, 2));
            $sheet->getStyle("F{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_RIGHT)
                ->setVertical(Alignment::VERTICAL_CENTER);

            $sheet->setCellValue("G{$row}", '₱ ' . number_format($totalSelling, 2));
            $sheet->getStyle("G{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_RIGHT)
                ->setVertical(Alignment::VERTICAL_CENTER);

            $row++;
            $count++;
        }

        // ── Grand total (skip one row) ────────────────────────────
        $row++;
        $sheet->setCellValue("G{$row}", '₱ ' . number_format($grandTotal, 2));
        $sheet->getStyle("G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="selling_price_report.xlsx"',
        ]);
    }
    public function exportPurchaseOrder(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/POTemplate.xlsx');
        $spreadsheet  = IOFactory::load($templatePath);
        $sheet        = $spreadsheet->getActiveSheet();

        // ── Inputs ────────────────────────────────────────────────────────────────
        $po             = $request->input('po', []);
        $options        = $request->input('options', []);
        $assignedAOName = $request->input('assignedAOName', '—');
        $firstOption    = $request->input('firstOption', []);
        $total          = floatval($request->input('total', 0));

        // ── Derived ───────────────────────────────────────────────────────────────
        $company  = $firstOption['purchase_option']['transaction_item']['transaction']['company'] ?? [];
        $supplier = $firstOption['purchase_option']['supplier'] ?? [];

        $fmtPHP = fn($n) => '₱ ' . number_format(floatval($n ?? 0), 2);

        $fmtDateTime = function ($val) {
            if (!$val) return '—';
            try {
                return (new \DateTime($val))->format('M j, Y g:i A');
            } catch (\Exception) {
                return $val;
            }
        };

        // ── Header ────────────────────────────────────────────────────────────────
        // Adjust cell references to match your POTemplate.xlsx layout.
        // These are reasonable defaults — update to match your actual template.
        $sheet->setCellValue('B3', $po['strPurchaseOrderNo']        ?? '—');
        $sheet->setCellValue('E3', $fmtDateTime($po['dtPurchaseOrderCreated'] ?? null));

        // ── Buyer / Company ───────────────────────────────────────────────────────
        $sheet->setCellValue('B6', $company['strCompanyName'] ?? '—');
        $sheet->setCellValue('B7', $company['strAddress']     ?? '');
        $sheet->setCellValue('B8', $company['strTIN']         ? 'TIN: ' . $company['strTIN'] : '');

        // ── Supplier ──────────────────────────────────────────────────────────────
        $sheet->setCellValue('E6', $supplier['strSupplierName'] ?? '—');
        $sheet->setCellValue('E7', $supplier['strAddress']      ?? '');
        $sheet->setCellValue('E8', $supplier['strTIN']          ? 'TIN: ' . $supplier['strTIN'] : '');

        // ── Meta row ──────────────────────────────────────────────────────────────
        $sheet->setCellValue('B10', $assignedAOName);
        $sheet->setCellValue('F9', $po['strShippingDetails'] ?? '—');
        $sheet->setCellValue('F10', $po['cPaymentTerms']   ?? '—');

        // ── Line items ────────────────────────────────────────────────────────────
        $row      = 13;   // first data row in your template
        $startRow = $row;

        foreach ($options as $idx => $opt) {
            $p         = $opt['purchase_option'] ?? [];
            $qty       = floatval($p['nQuantity']  ?? 0);
            $unitPrice = floatval($p['dUnitPrice'] ?? 0);
            $lineTotal = $qty * $unitPrice;

            $txnCode   = $p['transaction_item']['transaction']['strCode'] ?? '';
            $brandModel = implode(' · ', array_filter([$p['strBrand'] ?? '', $p['strModel'] ?? '']));
            $itemName   = $p['transaction_item']['strName'] ?? '—';

            // Insert a new row for every item after the first
            if ($idx > 0) {
                $sheet->insertNewRowBefore($row, 1);
            }

            $sheet->setCellValue("A{$row}", $idx + 1);
            $sheet->setCellValue("B{$row}", $txnCode);
            $sheet->setCellValue("C{$row}", $brandModel . ($itemName ? "\n" . $itemName : ''));
            $sheet->setCellValue("D{$row}", $qty);
            $sheet->setCellValue("E{$row}", $p['strUOM'] ?? '');
            $sheet->setCellValue("F{$row}", $unitPrice);
            $sheet->setCellValue("G{$row}", $lineTotal);

            $row++;
        }

        // ── Total row ─────────────────────────────────────────────────────────────
        $row++; // blank separator
        $sheet->setCellValue("F{$row}", 'ORDER TOTAL');
        $sheet->setCellValue("G{$row}", $total);

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="purchase_order.xlsx"',
        ]);
    }
    public function previewPurchaseOrder(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/POTemplate.xlsx');
        $spreadsheet  = IOFactory::load($templatePath);
        $sheet        = $spreadsheet->getActiveSheet();

        // ── Inputs ───────────────────────────────────────────────────────────────
        $paymentTerms = config('mappings.payment_terms');
        $po             = $request->input('po', []);
        $options        = $request->input('options', []);
        $assignedAOName = $request->input('assignedAOName', '—');
        $checkByOtherAOName = $request->input('checkByOtherAOName', '—');
        $generalManagerName = $request->input('generalManagerName', '—');
        $firstOption    = $request->input('firstOption', []);
        $total          = floatval($request->input('total', 0));
        $now = TimeHelper::now();
        $company  = $firstOption['purchase_option']['transaction_item']['transaction']['company'] ?? [];
        $supplier = $firstOption['purchase_option']['supplier'] ?? [];

        $fmtDateTime = function ($val) {
            if (!$val) return '—';
            try {
                return (new \DateTime($val))->format('M j, Y');
            } catch (\Exception) {
                return $val;
            }
        };
        $totalEWT = 0;
        $sheet->setCellValue('G5', $po['strPurchaseOrderNo']                   ?? '—');

        $sheet->setCellValue('I5', $fmtDateTime($now));
        $sheet->setCellValue('B2', strtoupper($company['strCompanyName']        ?? '—'));
        $sheet->setCellValue('B3', $company['strAddress']                       ?? '');
        $sheet->setCellValue('B4', $company['strEmail']                       ?? '');
        $sheet->setCellValue('B6', isset($company['strTIN']) ? 'TIN: ' . $company['strTIN'] : '');

        $sheet->setCellValue('B9',  $supplier['strSupplierName']                ?? '—');
        $sheet->setCellValue('B10', $supplier['strAddress']                     ?? '');
        $sheet->setCellValue('B11', isset($supplier['strTIN']) ? 'TIN: ' . $supplier['strTIN'] : '');

        // ← ADD: Supplier contact
        $contactName   = $firstOption['purchase_option']['supplier_contact']['strName']   ?? null;
        $contactNumber = $firstOption['purchase_option']['supplier_contact']['strNumber'] ?? null;
        $contactLabel  = $contactName && $contactNumber
            ? "{$contactName} - {$contactNumber}"
            : ($contactName ?? $contactNumber ?? '');
        $sheet->setCellValue('B12', "Contact Person: " . $contactLabel);

        // ← UPDATED: Strip HTML tags from shipping
        $shippingRaw   = $po['strShippingDetails'] ?? '—';
        $shippingClean = html_entity_decode(strip_tags($shippingRaw), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $sheet->setCellValue('F9', $shippingClean);

        $rawPaymentTerm = $po['cPaymentTerms'] ?? null;
        $sheet->setCellValue('H6', $rawPaymentTerm ? ($paymentTerms[$rawPaymentTerm] ?? $rawPaymentTerm) : '—');

        // ── Line items ────────────────────────────────────────────────────────────
        $row = 15;
        foreach ($options as $idx => $opt) {
            $p = $opt['purchase_option'] ?? [];
            $qty       = floatval($p['nQuantity']  ?? 0);
            $unitPrice = floatval($p['dUnitPrice'] ?? 0);
            $ewt       = floatval($p['dEWT']       ?? 0);
            $totalEWT += $ewt;
            $lineTotal = $qty * $unitPrice;

            $brandModel = implode(' · ', array_filter([$p['strBrand'] ?? '', $p['strModel'] ?? '']));
            $itemName   = $p['transaction_item']['strName'] ?? '—';

            if ($idx > 0) {
                $srcHeight = $sheet->getRowDimension(15)->getRowHeight();
                $sheet->insertNewRowBefore($row, 1);
                if ($srcHeight > 0) {
                    $sheet->getRowDimension($row)->setRowHeight($srcHeight);
                }

                // ── Copy cell styles from row 15 to the new row ──────────────────
                foreach (['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as $col) {
                    $srcStyle = $sheet->getStyle("{$col}15")->exportArray();
                    $sheet->getStyle("{$col}{$row}")->applyFromArray($srcStyle);
                }

                // ── Copy merged cells from row 15 to the new row ─────────────────
                foreach ($sheet->getMergeCells() as $mergeRange) {
                    // Parse the merge range e.g. "C15:E15"
                    [$startCell, $endCell] = explode(':', $mergeRange);

                    $startCol = preg_replace('/[0-9]/', '', $startCell);
                    $startRow = (int) preg_replace('/[^0-9]/', '', $startCell);
                    $endCol   = preg_replace('/[0-9]/', '', $endCell);
                    $endRow   = (int) preg_replace('/[^0-9]/', '', $endCell);

                    // Only copy merges that belong to row 15
                    if ($startRow === 15 && $endRow === 15) {
                        $sheet->mergeCells("{$startCol}{$row}:{$endCol}{$row}");
                    }
                }
            }

            $sheet->setCellValue("B{$row}", $idx + 1);
            $sheet->setCellValue("C{$row}", trim($brandModel));
            $sheet->setCellValue("F{$row}", $p['strUOM'] ?? '');
            $sheet->setCellValue("G{$row}", $qty);
            $sheet->setCellValue("H{$row}", $unitPrice);
            $sheet->setCellValue("I{$row}", $lineTotal);

            $row++;
        }
        // ── Total ─────────────────────────────────────────────────────────────────
        $row++;
        $sheet->setCellValue("I{$row}", $total);          // Gross total

        $row++;
        $row++;
        $totalMinusEWT = $total - $totalEWT;
        $sheet->setCellValue("I{$row}", $totalEWT > 0 ? $totalEWT : 0);
        $row++;
        $row++;
        $sheet->setCellValue("I{$row}", $totalMinusEWT);   // Net total (total - EWT)

        // ── Total in words ────────────────────────────────────────────────────────────
        $row++;
        $totalInWords = $this->numberToWords($totalMinusEWT);
        $sheet->setCellValue("B{$row}", 'Total Amount In Words: ' . $totalInWords);
        $sheet->getStyle("B{$row}")->getFont()->setBold(true)->setSize(9);

        // ── Prepared by (current user) — 5 rows below total in words ─────────────────
        $row += 5;
        $sheet->setCellValue("B{$row}", strtoupper($assignedAOName));
        $sheet->setCellValue("D{$row}", strtoupper($checkByOtherAOName));
        $sheet->setCellValue("e{$row}", strtoupper($generalManagerName));

        // ── Embed logo image into F2 ──────────────────────────────────────────────
        $logoPath = base_path('public/images/teknokratds-icon-rectangle.png');
        $logoFilename = $company['strLogo'] ?? null;

        if ($logoFilename) {
            $logoPath = public_path('logo/' . $logoFilename);

            if (file_exists($logoPath)) {
                $imgWidth  = 95;
                $imgHeight = 48;

                $cellWidthPx  = 320;
                $cellHeightPx = 50;

                $offsetX = (int)(($cellWidthPx - $imgWidth) / 2);
                $offsetY = (int)(($cellHeightPx - $imgHeight) / 2);

                $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                $drawing->setName('Logo');
                $drawing->setDescription('Company Logo');
                $drawing->setPath($logoPath);
                $drawing->setCoordinates('F2');
                $drawing->setOffsetX($offsetX);
                $drawing->setOffsetY($offsetY);
                $drawing->setWidth($imgWidth);
                $drawing->setHeight($imgHeight);
                $drawing->setResizeProportional(true);
                $drawing->setWorksheet($sheet);
            }
        }

        // ── Render to HTML ────────────────────────────────────────────────────────
        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);
        $writer->setEmbedImages(true);
        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        // ── Fix image paths → base64 inline ──────────────────────────────────────
        $html = preg_replace_callback(
            '/<img([^>]*?)src=["\'](?!data:)([^"\']+)["\']([^>]*?)>/i',
            function ($matches) {
                $path = $matches[2];
                if (!file_exists($path)) $path = base_path('public' . $path);
                if (!file_exists($path)) return $matches[0];
                $mime = mime_content_type($path);
                $b64  = base64_encode(file_get_contents($path));
                return '<img' . $matches[1] . 'src="data:' . $mime . ';base64,' . $b64 . '"' . $matches[3] . '>';
            },
            $html
        );

        return response($html, 200)->header('Content-Type', 'text/html');
    }
    private function numberToWords(float $amount): string
    {
        $ones = [
            '',
            'ONE',
            'TWO',
            'THREE',
            'FOUR',
            'FIVE',
            'SIX',
            'SEVEN',
            'EIGHT',
            'NINE',
            'TEN',
            'ELEVEN',
            'TWELVE',
            'THIRTEEN',
            'FOURTEEN',
            'FIFTEEN',
            'SIXTEEN',
            'SEVENTEEN',
            'EIGHTEEN',
            'NINETEEN'
        ];

        $tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

        $convert = function (int $n) use (&$convert, $ones, $tens): string {
            if ($n < 20) {
                return $ones[$n];
            }
            if ($n < 100) {
                $ten = $tens[(int)($n / 10)];
                $one = $n % 10 ? $ones[$n % 10] : '';
                return $one ? $ten . '-' . $one : $ten;   // hyphen added here
            }
            if ($n < 1000) {
                return $ones[(int)($n / 100)] . ' HUNDRED' . ($n % 100 ? ' ' . $convert($n % 100) : '');
            }
            if ($n < 1000000) {
                return $convert((int)($n / 1000)) . ' THOUSAND' . ($n % 1000 ? ' ' . $convert($n % 1000) : '');
            }
            if ($n < 1000000000) {
                return $convert((int)($n / 1000000)) . ' MILLION' . ($n % 1000000 ? ' ' . $convert($n % 1000000) : '');
            }
            return $convert((int)($n / 1000000000)) . ' BILLION' . ($n % 1000000000 ? ' ' . $convert($n % 1000000000) : '');
        };

        if ($amount == 0) {
            return 'ZERO AND 00/100';
        }

        $intPart = (int) floor($amount);
        $decPart = (int) round(($amount - $intPart) * 100);

        $words = $convert($intPart);
        if ($decPart > 0) {
            $words .= ' AND ' . str_pad($decPart, 2, '0', STR_PAD_LEFT) . '/100';
        }

        return $words . ' PESOS ONLY';
    }
    public function previewVoucher(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/VoucherTemplate.xlsx');
        $spreadsheet  = IOFactory::load($templatePath);
        $sheet        = $spreadsheet->getActiveSheet();

        $voucher        = $request->input('voucher', []);
        $isAssigneeType = $request->input('isAssigneeType', false);
        $payeeName   = $request->input('payeeName', '—');
        $supplierTIN    = $request->input('supplierTIN', '');
        $supplierAddress = $request->input('supplierAddress', '');
        $particulars    = $request->input('particulars', []); // assignee entries OR PO codes
        // At the top with the other inputs
        $paymentTerms  = config('mappings.payment_terms');  // ← same as previewPurchaseOrder
        $cPaymentTerms = $request->input('cPaymentTerms', null);

        $fmtDate = function ($val) {
            if (!$val) return '—';
            try {
                return (new \DateTime($val))->format('M j, Y');
            } catch (\Exception) {
                return $val;
            }
        };

        // ── Header ────────────────────────────────────────────────────────────────
        $sheet->setCellValue('B2', $payeeName);
        $sheet->setCellValue('K3', $supplierTIN  ?? '');
        $sheet->setCellValue('B3', $supplierAddress ?? '');
        $sheet->setCellValue('K2', $voucher['strNumber'] ?? '—');
        // $sheet->setCellValue('M2', $fmtDate($voucher['dtCreated'] ?? null));

        // ── Snapshot row 6 styles & merges BEFORE writing anything ───────────────────
        $templateStyles = [];
        foreach (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as $col) {
            $templateStyles[$col] = $sheet->getStyle("{$col}6")->exportArray();
        }
        $templateHeight = $sheet->getRowDimension(6)->getRowHeight();

        // ── If template height is -1 (auto), read the spreadsheet's actual default ──
        if ($templateHeight < 0) {
            $templateHeight = $sheet->getDefaultRowDimension()->getRowHeight();
            // If still -1, fall back to PhpSpreadsheet's internal default (12.75pt)
            if ($templateHeight < 0) {
                $templateHeight = 12.75;
            }
        }

        // ── Force row 6 itself to have the explicit height too ────────────────────
        $sheet->getRowDimension(6)->setRowHeight($templateHeight);
        $templateMerges = [];
        foreach ($sheet->getMergeCells() as $mergeRange) {
            [$startCell, $endCell] = explode(':', $mergeRange);
            $startColLetter = preg_replace('/[0-9]/', '', $startCell);
            $startRowNum    = (int) preg_replace('/[^0-9]/', '', $startCell);
            $endColLetter   = preg_replace('/[0-9]/', '', $endCell);
            $endRowNum      = (int) preg_replace('/[^0-9]/', '', $endCell);
            if ($startRowNum === 6 && $endRowNum === 6) {
                $templateMerges[] = [$startColLetter, $endColLetter];
            }
        }

        // ── Particulars ───────────────────────────────────────────────────────────────
        $row      = 6;
        $subtotal = 0;

        foreach ($particulars as $idx => $item) {
            $particular = $item['particular'] ?? '—';
            $qty        = floatval($item['qty']        ?? 1);
            $unitPrice  = floatval($item['unit_price'] ?? 0);
            $amount     = floatval($item['amount']     ?? ($qty * $unitPrice));

            $subtotal += $amount;

            if ($idx > 0) {
                $sheet->insertNewRowBefore($row, 1);

                if ($templateHeight > 0) {
                    $sheet->getRowDimension($row)->setRowHeight($templateHeight);
                }

                foreach ($templateStyles as $col => $style) {
                    $sheet->getStyle("{$col}{$row}")->applyFromArray($style);
                }

                foreach ($templateMerges as [$startCol, $endCol]) {
                    $sheet->mergeCells("{$startCol}{$row}:{$endCol}{$row}");
                }
            }

            $sheet->setCellValue("A{$row}", $particular);
            $sheet->setCellValue("H{$row}", $qty);
            $sheet->setCellValue("J{$row}", $unitPrice > 0 ? $unitPrice : $amount);
            $sheet->setCellValue("K{$row}", $amount);

            $row++;
        }

        // ── Skip 1 row, then subtotal ─────────────────────────────────────────────────
        $row++;
        $sheet->setCellValue("K{$row}", $subtotal);

        // ── Skip 1 row, then amount payable ──────────────────────────────────────────
        $row += 2;
        $sheet->setCellValue("K{$row}", $subtotal);
        // ── Payment terms (skip 9 rows below the last total row) ─────────────────────
        $paymentRow = $row + 9;

        // Column map: resolved label fragment → column letter
        // Keys must match the label values in config('mappings.payment_terms')
        $paymentColumns = [
            'J' => 'Cheque/PDC',  // was 'Check'
            'K' => 'Cash',
            'L' => 'Credit Card', // was 'Online'
            'M' => 'Others',
        ];
        // Resolve the raw key to its human-readable label (same way previewPurchaseOrder does)
        $resolvedLabel = $cPaymentTerms
            ? ($paymentTerms[$cPaymentTerms] ?? $cPaymentTerms)
            : null;

        foreach ($paymentColumns as $col => $label) {
            $cell = $col . $paymentRow;

            // Highlight the column whose label matches the resolved payment term
            if ($resolvedLabel && strcasecmp($resolvedLabel, $label) === 0) {
                $sheet->getStyle($cell)
                    ->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFADD8E6'); // light blue
            }
        }
        // // ── Skip 16 rows, then date in col L ─────────────────────────────────────────
        // $row += 16;
        // $sheet->setCellValue("L{$row}", $fmtDate($voucher['dtCreated'] ?? null));

        // ── Render HTML ───────────────────────────────────────────────────────────
        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);

        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        return response($html, 200)->header('Content-Type', 'text/html');
    }
    public function previewCheque(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }
        $templatePath = base_path('resources/templates/ChequeTemplate.xlsx');
        $spreadsheet  = IOFactory::load($templatePath);
        $sheet        = $spreadsheet->getActiveSheet();

        $payeeName = strtoupper($request->input('payeeName', '—'));
        $voucher     = $request->input('voucher', []);
        $particulars = $request->input('particulars', []);

        // ── Derive amount from particulars (same as previewVoucher subtotal) ─────
        $amount = 0;
        foreach ($particulars as $item) {
            $qty       = floatval($item['qty']        ?? 1);
            $unitPrice = floatval($item['unit_price'] ?? 0);
            $amount   += floatval($item['amount']     ?? ($qty * $unitPrice));
        }

        // ── Date parts from voucher created date ─────────────────────────────────
        $dtCreated = $voucher['dtCreated'] ?? null;
        $month = '';
        $day   = '';
        $year  = '';
        if ($dtCreated) {
            try {
                $d     = new \DateTime($dtCreated);
                $month = $d->format('m');
                $day   = $d->format('d');
                $year  = $d->format('Y');
            } catch (\Exception) {
            }
        }

        // ── Spread each digit apart with non-breaking spaces so it lines up with
        //    the template's printed digit boxes ───────────────────────────────
        $spaceOutDigits = fn(string $digits): string => implode("\u{00A0}\u{00A0}", str_split($digits));
        $monthSpaced = $spaceOutDigits($month);
        $daySpaced   = $spaceOutDigits($day);
        $yearSpaced  = "\u{00A0}\u{00A0}" . $spaceOutDigits($year);

        // ── Fill cells ────────────────────────────────────────────────────────────
        $sheet->setCellValue('H21', $monthSpaced);
        $sheet->setCellValue('I21', $daySpaced);
        $sheet->setCellValue('J21', $yearSpaced);
        $sheet->setCellValue('B22', $payeeName);
        $sheet->setCellValue('I22', $amount);
        $sheet->setCellValue('B24', $this->numberToWords($amount));

        // ── Make all dynamic cells use the same font as B22 (payee name) ─────────
        $refFont = $sheet->getStyle('B22')->getFont();
        $fontArray = [
            'name'  => $refFont->getName(),
            'size'  => $refFont->getSize(),
            'color' => ['argb' => $refFont->getColor()->getARGB()],
        ];

        foreach (['H21', 'I21', 'J21', 'I22', 'B24'] as $cell) {
            $sheet->getStyle($cell)->getFont()->applyFromArray($fontArray);
        }

        // ── Restrict sheet to rows 1–31, columns A–N ─────────────────────────────
        $spreadsheet->getActiveSheet()->setSelectedCell('A1');
        for ($r = 32; $r <= $sheet->getHighestRow(); $r++) {
            $sheet->getRowDimension($r)->setRowHeight(0);
            $sheet->getRowDimension($r)->setVisible(false);
        }

        // ── Force single-page output: clear template breaks + lock print area ────
        foreach ($sheet->getBreaks() as $cell => $break) {
            $sheet->setBreak($cell, Worksheet::BREAK_NONE);
        }
        $sheet->getPageSetup()->setPrintArea('A1:N32');
        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(1);

        // ── Render HTML ───────────────────────────────────────────────────────────
        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);
        $writer->setEmbedImages(true);
        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    public function previewDr(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/DRTemplate.xlsx');

        // ── STEP 1: Extract row heights ONCE from template (fast XML parse) ───
        $rowHeights = $this->extractRowHeightsFromTemplate($templatePath);

        // ── STEP 2: Load with read filter (fast) ──────────────────────────────
        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(false);
        $reader->setReadFilter(new class implements \PhpOffice\PhpSpreadsheet\Reader\IReadFilter {
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                $col = Coordinate::columnIndexFromString($columnAddress);
                return $row <= 42 && $col <= 9;
            }
        });

        $spreadsheet = $reader->load($templatePath);
        $sheet       = $spreadsheet->getActiveSheet();

        // ── STEP 3: Apply cached row heights ──────────────────────────────────
        foreach ($rowHeights as $row => $height) {
            if ($height > 0) {
                $sheet->getRowDimension($row)->setRowHeight($height);
            }
        }

        $transaction      = $request->input('transaction',      []);
        $deliveredOptions = $request->input('deliveredOptions', []);
        $assignedAOName   = $request->input('assignedAOName',   '—');
        $assignedAONo     = $request->input('assignedAONo',     '—');
        $transactionCode  = $request->input('transactionCode',  '—');

        $client = $transaction['client'] ?? [];
        $sheet->setCellValue('C4', strtoupper($client['strClientNickName'] ?? $client['strClientName'] ?? '—'));
        $sheet->setCellValue('C5', $client['strTIN']           ?? '');
        $sheet->setCellValue('C6', $client['strAddress']       ?? '');
        $sheet->setCellValue('C7', $client['strBusinessStyle'] ?? '');

        $sheet->setCellValue('E11', $assignedAOName);
        $sheet->setCellValue('F11', $assignedAONo);
        $sheet->setCellValue('G11', $transactionCode);

        $quillToText = function (string $html): string {
            $html = preg_replace('#<br\s*/?>#i', "\n", $html);
            $html = preg_replace('#</(p|div|h[1-6]|li|tr|blockquote)>#i', "\n", $html);
            $html = preg_replace('#<(p|div|h[1-6]|li|tr|blockquote)[^>]*>#i', '', $html);
            $plain = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $plain = preg_replace('/\n{2,}/', "\n", $plain);
            return trim($plain);
        };

        // ── Capture row 15 (item) & row 16 (specs) as reusable templates ───────
        $templateCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        $itemRowStyles  = [];
        $specsRowStyles = [];
        foreach ($templateCols as $col) {
            $itemRowStyles[$col]  = clone $sheet->getStyle("{$col}15");
            $specsRowStyles[$col] = clone $sheet->getStyle("{$col}16");
        }
        $itemRowHeight  = $rowHeights[15] ?? 15;
        $specsRowHeight = $rowHeights[16] ?? 15;

        // Capture any merged ranges anchored on row 15 or 16
        $templateMerges = [15 => [], 16 => []];
        foreach ($sheet->getMergeCells() as $mergeRange) {
            [$start, $end] = explode(':', $mergeRange);
            preg_match('/^([A-Z]+)(\d+)$/', $start, $m1);
            preg_match('/^([A-Z]+)(\d+)$/', $end, $m2);
            $startRow = (int) $m1[2];
            if ($startRow === 15 || $startRow === 16) {
                $templateMerges[$startRow][] = ['startCol' => $m1[1], 'endCol' => $m2[1]];
            }
        }

        $row         = 15;
        $isFirstItem = true;

        foreach ($deliveredOptions as $opt) {
            $qty      = $opt['itemQty']  ?? '';
            $uom      = $opt['itemUOM']  ?? '';
            $itemName = strtoupper($opt['itemName'] ?? '—');
            $specHtml = $opt['itemSpecs'] ?? '';

            // ── Collect all serial numbers from deliveredRows ──────────────────
            $serialNumbers = [];
            foreach (($opt['options'] ?? []) as $option) {
                foreach (($option['deliveredRows'] ?? []) as $dRow) {
                    foreach (($dRow['serialNumbers'] ?? []) as $sn) {
                        if (!empty($sn)) {
                            $serialNumbers[] = $sn;
                        }
                    }
                }
            }

            $hasSpecs   = !empty($specHtml) && trim(strip_tags($specHtml)) !== '' && trim($specHtml) !== '<p></p>';
            $hasSerials = !empty($serialNumbers);

            // Rows this item needs beyond the item-name row itself:
            // specs + S/N -> 2 extra rows, specs-only or S/N-only -> 1, neither -> 1 (blank)
            $extraRows = ($hasSpecs && $hasSerials) ? 2 : 1;
            $totalRows = 1 + $extraRows;

            if ($isFirstItem) {
                // First item reuses the existing template rows 15 (item) & 16 (specs).
                // If it needs a 3rd row (specs + S/N), insert one extra row after row 16.
                if ($totalRows > 2) {
                    $insertCount = $totalRows - 2;
                    $sheet->insertNewRowBefore($row + 2, $insertCount);
                    for ($i = 0; $i < $insertCount; $i++) {
                        $this->applyRowTemplate($sheet, $row + 2 + $i, $specsRowStyles, $specsRowHeight, 16, $templateMerges);
                    }
                }
            } else {
                // Make room and stamp the row15/16 templates onto the new rows
                $sheet->insertNewRowBefore($row, $totalRows);
                $this->applyRowTemplate($sheet, $row, $itemRowStyles, $itemRowHeight, 15, $templateMerges);
                for ($i = 1; $i < $totalRows; $i++) {
                    $this->applyRowTemplate($sheet, $row + $i, $specsRowStyles, $specsRowHeight, 16, $templateMerges);
                }
            }
            $isFirstItem = false;

            // ── Row 1: Qty | UOM | Item Name (bold) ───────────────────────────
            $sheet->setCellValue("B{$row}", $qty);
            $sheet->setCellValue("C{$row}", $uom);
            $sheet->setCellValue("D{$row}", $itemName);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true);
            $sheet->getRowDimension($row)->setRowHeight($itemRowHeight);
            $row++;

            if ($hasSpecs) {
                $specPlain = $quillToText($specHtml);
                $sheet->setCellValue("D{$row}", $specPlain);
                $sheet->getStyle("D{$row}")->getAlignment()->setWrapText(true);
                // ── Auto-fit row height based on number of lines ──────────────
                $lineCount = substr_count($specPlain, "\n") + 1;
                $sheet->getRowDimension($row)->setRowHeight(max($specsRowHeight, $lineCount * 13));
                $row++;

                if ($hasSerials) {
                    $snLine = 'S/N: ' . implode(', ', $serialNumbers);
                    $sheet->setCellValue("D{$row}", $snLine);
                    $sheet->getStyle("D{$row}")->getAlignment()->setWrapText(true);
                    $sheet->getStyle("D{$row}")->getFont()->setBold(true)->setItalic(true);
                    $sheet->getRowDimension($row)->setRowHeight($specsRowHeight);
                    $row++;
                }
            } elseif ($hasSerials) {
                $sheet->setCellValue("D{$row}", 'S/N: ' . implode(', ', $serialNumbers));
                $sheet->getStyle("D{$row}")->getAlignment()->setWrapText(true);
                $sheet->getStyle("D{$row}")->getFont()->setBold(true)->setItalic(true);
                $sheet->getRowDimension($row)->setRowHeight($specsRowHeight);
                $row++;
            } else {
                $row++;
            }
        }
        $sheet->setCellValue("D{$row}", '**Nothing Follows**');
        $sheet->getStyle("D{$row}")->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("D{$row}")->getFont()->setBold(true);

        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);

        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        return response($html, 200)->header('Content-Type', 'text/html');
    }
    public function previewSi(Request $request)
    {
        if (ob_get_length()) {
            ob_end_clean();
        }

        $templatePath = base_path('resources/templates/SITemplate.xlsx');

        // ── STEP 1: Extract row heights ONCE from template (fast XML parse) ───
        $rowHeights = $this->extractRowHeightsFromTemplate($templatePath);

        // ── STEP 2: Load with read filter (fast) ──────────────────────────────
        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(false);
        $reader->setReadFilter(new class implements \PhpOffice\PhpSpreadsheet\Reader\IReadFilter {
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                $col = Coordinate::columnIndexFromString($columnAddress);
                return $row <= 42 && $col <= 9;
            }
        });

        $spreadsheet = $reader->load($templatePath);
        $sheet       = $spreadsheet->getActiveSheet();

        // ── STEP 3: Apply cached row heights ──────────────────────────────────
        foreach ($rowHeights as $row => $height) {
            if ($height > 0) {
                $sheet->getRowDimension($row)->setRowHeight($height);
            }
        }

        $transaction      = $request->input('transaction',     []);
        $invoiceItems     = $request->input('invoiceItems',    []);
        $assignedAOName   = $request->input('assignedAOName',  '—');
        $assignedAONo     = $request->input('assignedAONo',    '—');

        $transactionCode  = $request->input('transactionCode', '—');

        $client = $transaction['client'] ?? [];
        $sheet->setCellValue('C4', strtoupper($client['strClientNickName'] ?? $client['strClientName'] ?? '—'));
        $sheet->setCellValue('C5', $client['strTIN']           ?? '');
        $sheet->setCellValue('C6', $client['strAddress']       ?? '');
        $sheet->setCellValue('C7', $client['strBusinessStyle'] ?? '');

        $sheet->setCellValue('E11', $assignedAOName);
        $sheet->setCellValue('F11', $assignedAONo);
        $sheet->setCellValue('G11', $transactionCode);

        $quillToText = function (string $html): string {
            $html = preg_replace('#<br\s*/?>#i', "\n", $html);
            $html = preg_replace('#</(p|div|h[1-6]|li|tr|blockquote)>#i', "\n", $html);
            $html = preg_replace('#<(p|div|h[1-6]|li|tr|blockquote)[^>]*>#i', '', $html);
            $plain = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $plain = preg_replace('/\n{2,}/', "\n", $plain);
            return trim($plain);
        };

        // ── Capture row 15 (item) & row 16 (specs) as reusable templates ───────
        $templateCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        $itemRowStyles  = [];
        $specsRowStyles = [];
        foreach ($templateCols as $col) {
            $itemRowStyles[$col]  = clone $sheet->getStyle("{$col}15");
            $specsRowStyles[$col] = clone $sheet->getStyle("{$col}16");
        }
        $itemRowHeight  = $rowHeights[15] ?? 15;
        $specsRowHeight = $rowHeights[16] ?? 15;

        // Capture any merged ranges anchored on row 15 or 16 (e.g. specs spanning D:I)
        $templateMerges = [15 => [], 16 => []];
        foreach ($sheet->getMergeCells() as $mergeRange) {
            [$start, $end] = explode(':', $mergeRange);
            preg_match('/^([A-Z]+)(\d+)$/', $start, $m1);
            preg_match('/^([A-Z]+)(\d+)$/', $end, $m2);
            $startRow = (int) $m1[2];
            if ($startRow === 15 || $startRow === 16) {
                $templateMerges[$startRow][] = ['startCol' => $m1[1], 'endCol' => $m2[1]];
            }
        }

        $row        = 15;
        $grandTotal = 0.0;
        $isFirstItem = true;

        foreach ($invoiceItems as $opt) {
            $qty        = $opt['itemQty']    ?? 0;
            $uom        = $opt['itemUOM']    ?? '';
            $itemName   = strtoupper($opt['itemName'] ?? '—');
            $specHtml   = $opt['itemSpecs']  ?? '';
            $unitPrice  = (float) ($opt['unitPrice']  ?? 0);
            $totalPrice = (float) ($opt['totalPrice'] ?? ($qty * $unitPrice));
            $grandTotal += $totalPrice;

            if (!$isFirstItem) {
                // Make room for this item and stamp the row15/16 template onto it
                $sheet->insertNewRowBefore($row, 2);
                $this->applyRowTemplate($sheet, $row,     $itemRowStyles,  $itemRowHeight,  15, $templateMerges);
                $this->applyRowTemplate($sheet, $row + 1, $specsRowStyles, $specsRowHeight, 16, $templateMerges);
            }
            $isFirstItem = false;

            // ── Row 1: Qty | UOM | Item Name (bold) | Unit Price | Total ───────────
            $sheet->setCellValue("B{$row}", $qty);
            $sheet->setCellValue("C{$row}", $uom);
            $sheet->setCellValue("D{$row}", $itemName);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true);
            $sheet->setCellValue("G{$row}", number_format($unitPrice, 2));
            $sheet->getStyle("G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->setCellValue("H{$row}", number_format($totalPrice, 2));
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $row++;

            $hasSpecs = !empty($specHtml) && trim(strip_tags($specHtml)) !== '' && trim($specHtml) !== '<p></p>';

            if ($hasSpecs) {
                $specPlain = $quillToText($specHtml);
                $sheet->setCellValue("D{$row}", $specPlain);
                $sheet->getStyle("D{$row}")->getAlignment()->setWrapText(true);
                $lineCount = substr_count($specPlain, "\n") + 1;
                $sheet->getRowDimension($row)->setRowHeight(max(15, $lineCount * 13));
            }
            $row++;
        }


        $sheet->setCellValue("D{$row}", '**Nothing Follows**');
        $sheet->getStyle("D{$row}")->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("D{$row}")->getFont()->setBold(true);

        // ── Grand total row ─────────────────────────────────────────────────────
        $row += 2;

        $sheet->setCellValue("H{$row}", number_format($grandTotal, 2));
        $sheet->getStyle("H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        $row += 6;
        $sheet->setCellValue("H{$row}", number_format($grandTotal, 2));
        $sheet->getStyle("H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getPageSetup()->setPrintArea('A1:I42');

        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);

        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        return response($html, 200)->header('Content-Type', 'text/html');
    }
    /**
     * Extract row heights from XLSX template via XML parsing (no full load needed)
     */
    private function extractRowHeightsFromTemplate(string $templatePath): array
    {
        $rowHeights = [];

        try {
            $zip = new \ZipArchive();
            if ($zip->open($templatePath) === true) {
                $xmlContent = $zip->getFromName('xl/worksheets/sheet1.xml');
                $zip->close();

                if ($xmlContent) {
                    $xml = simplexml_load_string($xmlContent);
                    if ($xml && isset($xml->sheetData)) {
                        foreach ($xml->sheetData->row as $rowElem) {
                            $rowNum = (int) $rowElem['r'];
                            $ht = (float) ($rowElem['ht'] ?? 0);
                            if ($ht > 0) {
                                $rowHeights[$rowNum] = $ht;
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Fail silently — filter load will still work, just without custom heights
        }

        return $rowHeights;
    }
    /**
     * Apply a captured row template (per-column styles, row height, merges)
     * onto a freshly inserted row.
     */
    private function applyRowTemplate($sheet, int $targetRow, array $colStyles, float $height, int $sourceRow, array $templateMerges): void
    {
        foreach ($colStyles as $col => $styleObj) {
            $sheet->duplicateStyle($styleObj, "{$col}{$targetRow}");
        }
        $sheet->getRowDimension($targetRow)->setRowHeight($height);

        foreach ($templateMerges[$sourceRow] as $m) {
            $sheet->mergeCells("{$m['startCol']}{$targetRow}:{$m['endCol']}{$targetRow}");
        }
    }
}
