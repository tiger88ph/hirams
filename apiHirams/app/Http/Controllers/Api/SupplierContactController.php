<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\SupplierContact;
use App\Models\SqlErrors;
use App\Events\SupplierContactUpdated;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SupplierContactController extends Controller
{
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

            broadcast(new SupplierContactUpdated('created', $supplierContact->nSupplierContactId, $supplierContact->nSupplierId))->toOthers();

            return response()->json([
                'message'          => __('messages.create_success', ['name' => 'Supplier Contact']),
                'supplier_contact' => $supplierContact,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Supplier Contact');
        }
    }

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

            broadcast(new SupplierContactUpdated('updated', $supplierContact->nSupplierContactId, $supplierContact->nSupplierId))->toOthers();

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

    public function destroy(int $id): JsonResponse
    {
        try {
            $supplierContact = SupplierContact::findOrFail($id);
            $supplierContact->delete();

            broadcast(new SupplierContactUpdated('deleted', $supplierContact->nSupplierContactId, $supplierContact->nSupplierId))->toOthers();

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
    public function bySupplier(int $supplierId): JsonResponse
    {
        try {
            $contacts = SupplierContact::where('nSupplierId', $supplierId)
                ->orderBy('strName', 'asc')
                ->get();

            return response()->json([
                'message'  => __('messages.retrieve_success', ['name' => 'Supplier Contacts']),
                'contacts' => $contacts,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Supplier Contacts');
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
