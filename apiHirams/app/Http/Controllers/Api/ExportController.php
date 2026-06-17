<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Writer\Html;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        $firstOption    = $request->input('firstOption', []);
        $total          = floatval($request->input('total', 0));

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
        $sheet->setCellValue('I5', $fmtDateTime($po['dtPurchaseOrderCreated']  ?? null));

        $sheet->setCellValue('B2', strtoupper($company['strCompanyName']        ?? '—'));
        $sheet->setCellValue('B3', $company['strAddress']                       ?? '');
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

        // ── Total in words ────────────────────────────────────────────────────────
        $row++;
        $totalInWords = $this->numberToWords($totalMinusEWT);
        $sheet->setCellValue("B{$row}", 'Total Amount In Words: ' . $totalInWords);
        $sheet->getStyle("B{$row}")->getFont()->setBold(true)->setSize(9);

        // ── Render to HTML ────────────────────────────────────────────────────────────
        // ── Render to HTML ────────────────────────────────────────────────────────────────
        $writer = new Html($spreadsheet);
        $writer->setUseInlineCss(true);
        $writer->setGenerateSheetNavigationBlock(false);
        $writer->setSheetIndex(0);
        $writer->setEmbedImages(true);   // ← ADD THIS
        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

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
                $month = $d->format('m');   // e.g. "06"
                $day   = $d->format('d');   // e.g. "23"
                $year  = $d->format('Y');   // e.g. "2026"
            } catch (\Exception) {
            }
        }

        // ── Fill cells ────────────────────────────────────────────────────────────
        $sheet->setCellValue('I21', $month);
        $sheet->setCellValue('J21', $day);
        $sheet->setCellValue('K21', $year);
        $sheet->setCellValue('B22', $payeeName);
        $sheet->setCellValue('I22', $amount);
        $sheet->setCellValue('B24', $this->numberToWords($amount));

        // ── Restrict sheet to rows 1–28, columns A–L ─────────────────────────────
        $spreadsheet->getActiveSheet()->setSelectedCell('A1');
        for ($r = 29; $r <= $sheet->getHighestRow(); $r++) {
            $sheet->getRowDimension($r)->setVisible(false)->setRowHeight(0);
        }

        // ── Render HTML ───────────────────────────────────────────────────────────
// ── Ensure font styles are preserved from template ────────────────────────
$writer = new Html($spreadsheet);
$writer->setUseInlineCss(true);
$writer->setGenerateSheetNavigationBlock(false);
$writer->setSheetIndex(0);
$writer->setEmbedImages(true); // ← add this, same as previewPurchaseOrder
        ob_start();
        $writer->save('php://output');
        $html = ob_get_clean();

        return response($html, 200)->header('Content-Type', 'text/html');
    }
}
