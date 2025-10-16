<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;

class SupplierController extends Controller
{
     /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $supplier = Supplier::all();
        return response()->json($supplier);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'strSupplierName' => 'required|string|max:100',
            'strNickName' => 'required|string|max:25',
            'strAddress' => 'nullable|string|max:200',
            'strTIN' => 'nullable|string|max:20',
            'bVAT' => 'required|integer|in:0,1',
            'bEWT' => 'required|integer|in:0,1',
        ]);


        $supplier = Supplier::create($data);
        return response()->json($supplier, 201);
    }

     /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $data = $request->validate([
            'strSupplierName' => 'required|string|max:100',
            'strNickName' => 'required|string|max:25',
            'strAddress' => 'nullable|string|max:200',
            'strTIN' => 'nullable|string|max:20',
            'bVAT' => 'required|integer|in:0,1',
            'bEWT' => 'required|integer|in:0,1',
        ]);

        $supplier->update($data);

        return response()->json($supplier, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            // Find user by ID
            $supplier = Supplier::findOrFail($id);

            // Delete the record
            $supplier->delete();

            // Return success response
            return response()->json([
                'message' => 'Supplier deleted successfully.',
                'deleted_supplier' => $supplier
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // If user not found
            return response()->json([
                'message' => 'Supplier not found.'
            ], 404);

        } catch (\Exception $e) {
            // Catch other errors
            return response()->json([
                'message' => 'Failed to delete supplier.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
