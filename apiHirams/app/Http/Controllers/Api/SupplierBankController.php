<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\SupplierBank;
use App\Models\SqlErrors;
use App\Events\SupplierBankUpdated;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SupplierBankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SupplierBank::with('supplier');

            if ($supplierId = $request->query('supplier_id')) {
                $query->where('nSupplierId', $supplierId);
            }

            $banks = $query->orderBy('strBankName', 'asc')->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Banks']),
                'banks'   => $banks,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Supplier Banks');
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId'      => 'required|integer',
                'strBankName'      => 'required|string|max:100',
                'strAccountName'   => 'required|string|max:100',
                'strAccountNumber' => 'required|string|max:20',
            ]);

            $bank = SupplierBank::create($validated);

            broadcast(new SupplierBankUpdated('created', $bank->nSupplierBankId, $bank->nSupplierId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Supplier Bank']),
                'bank'    => $bank,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Supplier Bank');
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $bank = SupplierBank::with('supplier')->findOrFail($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Bank']),
                'bank'    => $bank,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Supplier Bank');
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strBankName'      => 'required|string|max:100',
                'strAccountName'   => 'required|string|max:100',
                'strAccountNumber' => 'required|string|max:20',
            ]);

            $bank = SupplierBank::findOrFail($id);
            $bank->update($validated);

            broadcast(new SupplierBankUpdated('updated', $bank->nSupplierBankId, $bank->nSupplierId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Supplier Bank']),
                'bank'    => $bank,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Supplier Bank');
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $bank = SupplierBank::findOrFail($id);
            $bank->delete();

            broadcast(new SupplierBankUpdated('deleted', $bank->nSupplierBankId, $bank->nSupplierId))->toOthers();

            return response()->json([
                'message'      => __('messages.delete_success', ['name' => 'Supplier Bank']),
                'deleted_bank' => $bank,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Supplier Bank');
        }
    }
    public function bySupplier(int $supplierId): JsonResponse
    {
        try {
            $banks = SupplierBank::where('nSupplierId', $supplierId)
                ->orderBy('strBankName', 'asc')
                ->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Banks']),
                'banks'   => $banks,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Supplier Banks');
        }
    }
    private function handleException(Exception $e, string $messageKey, string $entityName): JsonResponse
    {
        SqlErrors::create([
            'dtDate'   => now(),
            'strError' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => __("messages.{$messageKey}", ['name' => $entityName]),
            'error'   => $e->getMessage(),
        ], 500);
    }
}
