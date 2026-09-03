<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Jev;
use App\Models\JevEntries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JevController extends Controller
{
    private function withCompanyRelations(): array
    {
        return [
            'entries.journal_account.parent',
            'vouchers.supplier',
            'vouchers.voucher_assignees.assignee',
            'vouchers.company',
            'vouchers.voucher_suppliers.purchase_order.purchaseOrderOptions.purchaseOption.transactionItem.transaction.company',
        ];
    }

    public function index()
    {
        $res = Jev::with($this->withCompanyRelations())->get()
            ->map(fn($jev) => $this->attachCompanyMeta($jev));
        return response()->json($res);
    }

    public function show($id)
    {
        $res = Jev::with($this->withCompanyRelations())->find($id);
        if (!$res) return response()->json(['message' => 'Not Found'], 404);
        return response()->json($this->attachCompanyMeta($res));
    }

    public function getByLink($link)
    {
        $res = Jev::where('cJEVLinkType', $link)
            ->orWhereHas('entries', fn($q) => $q->where('dAmount', '!=', 0))
            ->with($this->withCompanyRelations())
            ->first();

        if (!$res) return response()->json(['message' => 'Not Found'], 404);
        return response()->json($this->attachCompanyMeta($res));
    }

    public function store(Request $request)
    {
        $res = DB::transaction(function () use ($request) {
            $jev = Jev::create([
                'cJEVLinkType' => $request->cJEVLinkType,
                'dtOccur'      => now(),
                'cStatus'      => 'P',
            ]);

            return Jev::with('entries.journal_account')->find($jev->nJEVId);
        });
        return response()->json($res, 201);
    }

    public function update(Request $request, $id)
    {
        $jev = Jev::find($id);
        if (!$jev) return response()->json(['message' => 'Not Found'], 404);

        if ($request->cStatus === 'toggle') {
            $newStatus = $jev->cStatus === 'P' ? 'A' : 'P';
            $jev->update([
                'cJEVLinkType' => $request->cJEVLinkType ?? $jev->cJEVLinkType,
                'dtOccur'      => $request->dtOccur ?? $jev->dtOccur,
                'cStatus'      => $newStatus,
            ]);
        } else {
            $jev->update([
                'cJEVLinkType' => $request->cJEVLinkType ?? $jev->cJEVLinkType,
                'dtOccur'      => $request->dtOccur ?? $jev->dtOccur,
                'cStatus'      => $request->cStatus ?? $jev->cStatus,
            ]);
        }

        return response()->json(Jev::with('entries.journal_account')->find($id));
    }

    public function destroy($id)
    {
        $jev = Jev::find($id);
        if (!$jev) return response()->json(['message' => 'Not Found'], 404);

        JevEntries::where('nJEVId', $id)->delete();
        $jev->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    private function attachCompanyMeta(Jev $jev): Jev
    {
        $voucher = $jev->vouchers->first(); // adjust if a Jev can ever have >1 voucher

        if (!$voucher) {
            $meta = [
                'strPayeeName'     => '—',
                'strCompanyName'   => 'No Company',
                'bIsAssigneeType'  => false,
                'strVoucherNumber' => $jev->cJEVLinkType,
            ];
        } else {
            $isAssigneeType = $voucher->voucher_assignees->count() > 0
                && !$voucher->voucher_suppliers->count();

            $payeeName = $isAssigneeType
                ? ($voucher->strTitle ?? $voucher->voucher_assignees->first()?->assignee?->strAssigneeName ?? '—')
                : ($voucher->supplier?->strSupplierName ?? '—');

            $companyName = 'No Company';
            if ($isAssigneeType) {
                $companyName = $voucher->company?->strCompanyName ?? $voucher->company?->strCompanyNickName ?? 'No Company';
            } else {
                foreach ($voucher->voucher_suppliers as $vs) {
                    $company = $vs->purchase_order?->purchaseOrderOptions
                        ->map(fn($o) => $o->purchaseOption?->transactionItem?->transaction?->company)
                        ->first(fn($c) => $c);
                    if ($company) {
                        $companyName = $company->strCompanyName ?? $company->strName ?? 'No Company';
                        break;
                    }
                }
            }

            $meta = [
                'strPayeeName'     => $payeeName,
                'strCompanyName'   => $companyName,
                'bIsAssigneeType'  => $isAssigneeType,
                'strVoucherNumber' => $voucher->strNumber,
            ];
        }

        // Stamp the same meta onto every entry so the frontend hook picks it up
        $jev->entries->each(function ($entry) use ($meta) {
            $entry->strPayeeName     = $meta['strPayeeName'];
            $entry->strCompanyName   = $meta['strCompanyName'];
            $entry->bIsAssigneeType  = $meta['bIsAssigneeType'];
            $entry->strVoucherNumber = $meta['strVoucherNumber'];
        });

        return $jev;
    }
}
