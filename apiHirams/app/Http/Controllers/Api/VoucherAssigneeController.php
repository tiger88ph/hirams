<?php

namespace App\Http\Controllers\Api;

use App\Events\VoucherAssigneeUpdated;
use App\Events\VoucherUpdated;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherAssignee;
use Exception;
use Illuminate\Http\Request;

class VoucherAssigneeController extends Controller
{
    public function index()
    {
        return response()->json(
            VoucherAssignee::with(['assignee', 'voucher.company']) // ✅ Get company from Voucher
                ->orderByDesc('nVoucherAssigneeId')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nVoucherId'    => 'required|integer|exists:tblvouchers,nVoucherId',
            // ❌ REMOVED nCompanyId validation
            'nAssigneeId'   => 'required|integer',
            'strParticular' => 'required|string',
            'nQuantity'     => 'nullable|integer|min:1',
            'strUOM'        => 'nullable|string|max:20',
            'dAmount'       => 'required|numeric|min:0.01',
        ]);

        $voucherAssignee = VoucherAssignee::create([
            'nVoucherId'    => $validated['nVoucherId'],
            // ❌ REMOVED nCompanyId
            'nAssigneeId'   => $validated['nAssigneeId'],
            'strParticular' => $validated['strParticular'],
            'nQuantity'     => $validated['nQuantity'] ?? 1,
            'strUOM'        => $validated['strUOM'] ?? null,
            'dAmount'       => $validated['dAmount'],
        ]);

        broadcast(new VoucherAssigneeUpdated(
            'created',
            $voucherAssignee->nVoucherId,
            $voucherAssignee->nVoucherAssigneeId,
        ));

        return response()->json($voucherAssignee->load(['assignee', 'voucher.company']), 201);
    }

    public function show(string $id)
    {
        return response()->json(
            VoucherAssignee::with(['assignee', 'voucher.company'])->findOrFail($id)
        );
    }

    public function update(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                // ❌ REMOVED nCompanyId validation
                'strParticular' => 'required|string',
                'nQuantity'     => 'nullable|integer|min:1',
                'strUOM'        => 'nullable|string|max:20',
                'dAmount'       => 'required|numeric|min:0.01',
            ]);

            $voucherAssignee = VoucherAssignee::findOrFail($id);
            $voucherAssignee->update($validated);

            broadcast(new VoucherAssigneeUpdated(
                'updated',
                $voucherAssignee->nVoucherId,
                $voucherAssignee->nVoucherAssigneeId,
            ));

            return response()->json([
                'message' => 'Voucher assignee updated successfully.',
                'data'    => $voucherAssignee->load(['assignee', 'voucher.company']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to update voucher assignee.', 'error' => $e->getMessage()], 500);
        }
    }
public function destroy(string $id)
{
    try {
        $voucherAssignee   = VoucherAssignee::findOrFail($id);
        $voucherId         = $voucherAssignee->nVoucherId;
        $voucherAssigneeId = $voucherAssignee->nVoucherAssigneeId;

        $voucherAssignee->delete();

        $remainingAssignees = VoucherAssignee::where('nVoucherId', $voucherId)->count();
        $remainingSuppliers = \App\Models\VoucherSupplier::where('nVoucherId', $voucherId)->count();

        if ($remainingAssignees === 0 && $remainingSuppliers === 0) {
            Voucher::where('nVoucherId', $voucherId)->delete();
            broadcast(new VoucherUpdated('deleted', $voucherId));
        } else {
            broadcast(new VoucherAssigneeUpdated('deleted', $voucherId, $voucherAssigneeId));
        }

        return response()->json([
            'message'         => 'Assignee deleted successfully.',
            'voucher_deleted' => $remainingAssignees === 0 && $remainingSuppliers === 0,
        ]);
    } catch (Exception $e) {
        return response()->json(['message' => 'Failed to delete assignee.', 'error' => $e->getMessage()], 500);
    }
}
}
