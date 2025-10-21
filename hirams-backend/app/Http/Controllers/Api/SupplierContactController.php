<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\SqlErrors;
use App\Models\SupplierContact;

class SupplierContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $supplier_contact = SupplierContact::all();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplier_contact
            ], 200);

        } catch (Exception $e) {
            // Log error to sqlerrors table
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching supplier contact: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Supplier Contact']),
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
            // Validate request data
            $data = $request->validate([
                'nSupplierId' => 'required|integer',
                'strName' => 'required|string|max:50',
                'strNumber' => 'required|string|max:50',
                'strPosition' => 'nullable|string|max:50',
                'strDepartment' => 'nullable|string|max:50',
            ]);

            // Create supplier contact record
            $supplier_contact = SupplierContact::create($data);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplier_contact
            ], 201);

        } catch (Exception $e) {
            // Log error to sqlerrors table
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating supplier contact: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Supplier Contact']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id, )
    {
        //
    }

  
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Find supplier contact record
            $supplier_contact = SupplierContact::findOrFail($id);

            // Validate request data
            $data = $request->validate([
                'nSupplierId' => 'required|integer|max:100',
                'strName' => 'required|string|max:50',
                'strNumber' => 'required|string|max:50',
                'strPosition' => 'nullable|string|max:50',
                'strDepartment' => 'nullable|string|max:50',
            ]);

            // Update supplier contact
            $supplier_contact->update($data);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplier_contact
            ], 200);

        } catch (ModelNotFoundException $e) {
            // Optionally log "not found" errors
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Supplier Contact ID $id not found: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Contact'])
            ], 404);

        } catch (Exception $e) {
            // Log any other error
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating Supplier Contact ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Supplier Contact']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $supplier_contact = SupplierContact::findOrFail($id);
            $supplier_contact->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Supplier Contact']),
                'deleted_supplier_contact' => $supplier_contact
            ], 200);

        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => 'Supplier Contact ID ' . $id . ' not found: ' . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Contact'])
            ], 404);

        } catch (Exception $e) {
            // ✅ Use Eloquent to log SQL error
            try {
                SqlErrors::create([
                    'dtDate' => now(),
                    'strError' => 'Error deleting supplier contact ID ' . $id . ': ' . $e->getMessage(),
                ]);
            } catch (Exception $logError) {
                Log::error('Failed to log SQL error: ' . $logError->getMessage());
            }

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Supplier Contact']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
