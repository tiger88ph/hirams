<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SupplierBank;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\SqlErrors;

class SupplierBankController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $supplierId = $request->query('supplier_id');

            if ($supplierId) {
                $banks = SupplierBank::where('strSupplierId', $supplierId)->get();
            } else {
                $banks = SupplierBank::all();
            }

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Banks']),
                'banks' => $banks
            ], 200);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching supplier banks: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Supplier Banks']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'nSupplierId' => 'required|integer|exists:tblsuppliers,nSupplierId',
                'strBankName' => 'required|string|max:100',
                'strAccountName' => 'required|string|max:100',
                'strAccountNumber' => 'required|string|max:20',
            ]);

            $bank = SupplierBank::create($data);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Supplier Bank']),
                'bank' => $bank
            ], 201);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating supplier bank: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Supplier Bank']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $bank = SupplierBank::findOrFail($id);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Bank']),
                'bank' => $bank
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank'])
            ], 404);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching supplier bank ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Supplier Bank']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $bank = SupplierBank::findOrFail($id);

            $data = $request->validate([
                'strBankName' => 'required|string|max:100',
                'strAccountName' => 'required|string|max:100',
                'strAccountNumber' => 'required|string|max:20',
            ]);

            $bank->update($data);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Supplier Bank']),
                'bank' => $bank
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank'])
            ], 404);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating supplier bank ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Supplier Bank']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $bank = SupplierBank::findOrFail($id);
            $bank->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Supplier Bank']),
                'deleted_bank' => $bank
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Bank'])
            ], 404);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error deleting supplier bank ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Supplier Bank']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
