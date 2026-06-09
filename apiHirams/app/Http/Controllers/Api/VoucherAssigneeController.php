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
            VoucherAssignee::with('assignee')->orderByDesc('nVoucherAssigneeId')->get()
        );
    }

    public function store(Request $request)
    {
        $voucherAssignee = VoucherAssignee::create([
            'nVoucherId'    => $request->nVoucherId,
            'nAssigneeId'   => $request->nAssigneeId,
            'strParticular' => $request->strParticular,
            'dAmount'       => $request->dAmount,
        ]);

        broadcast(new VoucherAssigneeUpdated(
            'created',
            $voucherAssignee->nVoucherId,
            $voucherAssignee->nVoucherAssigneeId,
        ));

        return response()->json($voucherAssignee->load('assignee'), 201);
    }

    public function show(string $id)
    {
        return response()->json(VoucherAssignee::with('assignee')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'strParticular' => 'required|string',
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
                'data'    => $voucherAssignee->load('assignee'),
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

            $remaining = VoucherAssignee::where('nVoucherId', $voucherId)->count();

            if ($remaining === 0) {
                Voucher::where('nVoucherId', $voucherId)->delete();
                broadcast(new VoucherUpdated('deleted', $voucherId));
            } else {
                broadcast(new VoucherAssigneeUpdated('deleted', $voucherId, $voucherAssigneeId));
            }

            return response()->json([
                'message'         => 'Assignee deleted successfully.',
                'voucher_deleted' => $remaining === 0,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to delete assignee.', 'error' => $e->getMessage()], 500);
        }
    }
}