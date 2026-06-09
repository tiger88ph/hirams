<?php

namespace App\Http\Controllers\Api;

use App\Events\VoucherSupplierUpdated;
use App\Events\VoucherUpdated;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherSupplier;
use Exception;
use Illuminate\Http\Request;

class VoucherSupplierController extends Controller
{
    public function index()
    {
        return response()->json(VoucherSupplier::all());
    }

    public function show(string $id)
    {
        return response()->json(VoucherSupplier::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $voucherSupplier = VoucherSupplier::findOrFail($id);
        $voucherSupplier->update([
            'nVoucherId'       => $request->nVoucherId,
            'nPurchaseOrderId' => $request->nPurchaseOrderId,
        ]);

        broadcast(new VoucherSupplierUpdated(
            'updated',
            $voucherSupplier->nVoucherId,
            $voucherSupplier->nVoucherSupplierId,
        ));

        return response()->json($voucherSupplier);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nVoucherId'       => 'required|integer|exists:tblvoucher,nVoucherId',
                'nPurchaseOrderId' => 'required|integer|exists:tblpurchaseorder,nPurchaseOrderId',
            ]);

            $existing = VoucherSupplier::where($validated)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'This PO is already linked to this voucher.',
                ], 409);
            }

            $voucherSupplier = VoucherSupplier::create($validated);

            broadcast(new VoucherSupplierUpdated(
                'created',
                $voucherSupplier->nVoucherId,
                $voucherSupplier->nVoucherSupplierId,
            ));

            return response()->json([
                'message' => 'PO linked to voucher successfully.',
                'data'    => $voucherSupplier,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to link PO to voucher.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $voucherSupplier   = VoucherSupplier::findOrFail($id);
            $voucherId         = $voucherSupplier->nVoucherId;
            $voucherSupplierId = $voucherSupplier->nVoucherSupplierId;

            $voucherSupplier->delete();

            $remaining = VoucherSupplier::where('nVoucherId', $voucherId)->count();

            if ($remaining === 0) {
                Voucher::where('nVoucherId', $voucherId)->delete();
                broadcast(new VoucherUpdated('deleted', $voucherId));
            } else {
                broadcast(new VoucherSupplierUpdated('deleted', $voucherId, $voucherSupplierId));
            }

            return response()->json([
                'message'         => 'Supplier link deleted successfully.',
                'voucher_deleted' => $remaining === 0,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to delete supplier link.', 'error' => $e->getMessage()], 500);
        }
    }
}
