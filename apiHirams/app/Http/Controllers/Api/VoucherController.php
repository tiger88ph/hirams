<?php
namespace App\Http\Controllers\Api;

use App\Events\VoucherUpdated;
use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherSupplier;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function index()
    {
        return response()->json(
            Voucher::with([
                'supplier:nSupplierId,strSupplierNickName,strSupplierName,strTIN,strAddress',
                'voucher_suppliers.purchase_order.purchaseOrderOptions.purchaseOption.transactionItem.transaction',
                'voucher_assignees.assignee',
            ])->orderByDesc('nVoucherId')->get()
        );
    }

    public function store(Request $request)
    {
        $year    = date('Y');
        $last    = Voucher::where('strNumber', 'like', $year . '-%')
            ->orderByDesc('nVoucherId')
            ->first();
        $nextSeq  = $last ? (int) substr($last->strNumber, 5) + 1 : 1;
        $strNumber = $year . '-' . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

        $voucher = Voucher::create([
            'cType'     => $request->cType,
            'nTypeId'   => $request->nTypeId,
            'strNumber' => $strNumber,
            'cStatus'   => $request->cStatus ?? 'A',
            'dtCreated' => TimeHelper::now(),
        ]);

        foreach ($request->nPurchaseOrderIds ?? [] as $poId) {
            VoucherSupplier::create([
                'nVoucherId'       => $voucher->nVoucherId,
                'nPurchaseOrderId' => $poId,
            ]);
        }

        broadcast(new VoucherUpdated('created', $voucher->nVoucherId));

        return response()->json($voucher, 201);
    }

    public function show(string $id)
    {
        return response()->json(Voucher::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->update([
            'cType'     => $request->cType,
            'nTypeId'   => $request->nTypeId,
            'strNumber' => $request->strNumber,
            'cStatus'   => $request->cStatus,
            'dtCreated' => $request->dtCreated,
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