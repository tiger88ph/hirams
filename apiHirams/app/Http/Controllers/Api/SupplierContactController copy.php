<?php
namespace App\Http\Controllers\Api;

use Exception;
use App\Models\SupplierContact;
use App\Models\SqlErrors;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SupplierContactController extends Controller
{
    /**
     * Get all supplier contacts
     */
    public function index(): JsonResponse
    {
        try {
            $supplierContacts = SupplierContact::with('supplier')
                ->orderBy('strName', 'asc')
                ->get();

            return response()->json([
                'message'           => __('messages.retrieve_success', ['name' => 'Supplier Contacts']),
                'supplier_contacts' => $supplierContacts,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Supplier Contacts');
        }
    }

    /**
     * Create a new supplier contact
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId'   => 'required|integer',
                'strName'       => 'required|string|max:50',
                'strNumber'     => 'required|string|max:50',
                'strPosition'   => 'nullable|string|max:50',
                'strDepartment' => 'nullable|string|max:50',
            ]);

            $supplierContact = SupplierContact::create($validated);

            return response()->json([
                'message'          => __('messages.create_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplierContact,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Supplier Contact');
        }
    }

    /**
     * Update an existing supplier contact
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nSupplierId'   => 'required|integer',
                'strName'       => 'required|string|max:50',
                'strNumber'     => 'required|string|max:50',
                'strPosition'   => 'nullable|string|max:50',
                'strDepartment' => 'nullable|string|max:50',
            ]);

            $supplierContact = SupplierContact::findOrFail($id);
            $supplierContact->update($validated);

            return response()->json([
                'message'          => __('messages.update_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplierContact,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Contact']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Supplier Contact');
        }
    }

    /**
     * Delete a supplier contact
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $supplierContact = SupplierContact::findOrFail($id);
            $supplierContact->delete();

            return response()->json([
                'message'                  => __('messages.delete_success', ['name' => 'Supplier Contact']),
                'deleted_supplier_contact' => $supplierContact,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier Contact']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Supplier Contact');
        }
    }

    /**
     * Centralized exception handling
     */
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