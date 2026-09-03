<?php

namespace App\Http\Controllers\Api;

use App\Events\VoucherUpdated;

use App\Http\Controllers\Controller;
use App\Models\Jev;
use App\Models\Voucher;
use App\Models\VoucherSupplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoucherController extends Controller
{
    public function index()
    {
        $vouchers = Voucher::with([
            'jev',
            'supplier:nSupplierId,strSupplierNickName,strSupplierName,strTIN,strAddress',
            'voucher_suppliers.purchase_order.purchaseOrderOptions.purchaseOption.transactionItem.transaction',
            'voucher_assignees.assignee',
            'voucher_assignees.voucher.company', // ✅ Company from Voucher
        ])->orderByDesc('nVoucherId')->get();
        // Flatten the assigned AO's user id onto each voucher.
        // All PO's on a voucher share the same assignee, so the first non-null wins.
        $vouchers->each(function ($voucher) {
            $nAssignedUserId = null;

            foreach ($voucher->voucher_suppliers as $vs) {
                $nAssignedUserId = $vs->purchase_order
                    ?->purchaseOrderOptions?->first()
                    ?->purchaseOption
                    ?->transactionItem
                    ?->transaction
                    ?->nAssignedAO;

                if ($nAssignedUserId !== null) {
                    break;
                }
            }

            $voucher->nAssignedUserId = $nAssignedUserId;
        });

        return response()->json($vouchers);
    }
    public function createJev(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        if ($voucher->nJEVId) {
            return response()->json(['message' => 'JEV already exists.'], 422);
        }

        $result = DB::transaction(function () use ($voucher) {
            // ✅ Use dvTypeKey (passed as cJEVLinkType from frontend)
            $jev = Jev::create([
                'cJEVLinkType' => request()->input('cJEVLinkType'), // ✅ dvTypeKey
                'dtOccur'      => now(),
                'cStatus'      => 'P',
            ]);

            $voucher->nJEVId = $jev->nJEVId;
            $voucher->save();
            return $jev;
        });

        broadcast(new VoucherUpdated('jev_created', $voucher->nVoucherId));

        return response()->json([
            'message' => 'JEV created successfully.',
            'jev'     => $result,
            'nJEVId'  => $result->nJEVId,
        ], 201);
    }
    public function store(Request $request)
    {
        $voucher = DB::transaction(function () use ($request) {
            $year   = date('Y');
            $prefix = 'DV' . $year . '-';

            $last = Voucher::where('strNumber', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderByDesc('strNumber')
                ->first();

            $nextSeq   = $last ? (int) substr($last->strNumber, strlen($prefix)) + 1 : 1;
            $strNumber = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            return Voucher::create([
                'strTitle'   => $request->strTitle,
                'cType'      => $request->cType,
                'nTypeId'    => $request->nTypeId,
                'strNumber'  => $strNumber,
                'cStatus'    => $request->cStatus ?? 'A',

                'nCompanyId' => $request->nCompanyId ?? null, // ✅ RESTORE THIS LINE
                'nJEVId'     => $request->nJEVId ?? null,
                'dtCreated'  => now(),
            ]);
        });
        foreach ($request->nPurchaseOrderIds ?? [] as $poId) {
            VoucherSupplier::create([
                'nVoucherId'       => $voucher->nVoucherId,
                'nPurchaseOrderId' => $poId,
            ]);
        }

        // In store() — creating first particular:
        foreach ($request->assignees ?? [] as $a) {
            \App\Models\VoucherAssignee::create([
                'nVoucherId'    => $voucher->nVoucherId,
                // ❌ REMOVED nCompanyId — ONLY on Voucher now
                'nAssigneeId'   => $a['nAssigneeId'] ?? null,
                'strParticular' => $a['strParticular'] ?? null,
                'nQuantity'     => $a['nQuantity'] ?? 1,
                'strUOM'        => $a['strUOM'] ?? null,
                'dAmount'       => $a['dAmount'] ?? 0,
            ]);
        }
        broadcast(new VoucherUpdated('created', $voucher->nVoucherId));

        return response()->json($voucher, 201);
    }


    public function show(string $id)
    {
        return response()->json(
            Voucher::with(['jev', 'voucher_assignees.assignee', 'voucher_assignees.company', 'voucher_suppliers.purchase_order.purchaseOrderOptions.purchaseOption'])
                ->findOrFail($id)
        );
    }

    public function update(Request $request, string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->update([
            'strTitle'   => $request->strTitle,
            'cType'      => $request->cType,
            'nTypeId'    => $request->nTypeId,
            'strNumber'  => $request->strNumber,
            'cStatus'    => $request->cStatus,
            'nCompanyId' => $request->nCompanyId ?? $voucher->nCompanyId, // ✅ RESTORE
            'nJEVId'     => $request->nJEVId ?? $voucher->nJEVId,
            'dtCreated'  => $request->dtCreated,
        ]);
        broadcast(new VoucherUpdated('updated', $voucher->nVoucherId));
        return response()->json($voucher);
    }
    public function destroy(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucherId = $voucher->nVoucherId;
        $voucher->delete();

        broadcast(new VoucherUpdated('deleted', $voucherId));

        return response()->json(['message' => 'Voucher deleted successfully.']);
    }

    public function updateStatus(Request $request, string $id)
    {
        $request->validate(['cStatus' => 'required']);

        $voucher           = Voucher::findOrFail($id);
        $voucher->cStatus  = $request->cStatus;
        $voucher->save();

        broadcast(new VoucherUpdated('status_changed', $voucher->nVoucherId));

        return response()->json([
            'message' => 'Voucher status updated successfully.',
            'voucher' => $voucher,
        ]);
    }
}
