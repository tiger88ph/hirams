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

        $templatePath = storage_path('app/private/templates/transaction_temp.xlsx');
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
}
