<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Events\SupplierUpdated;
use App\Models\SqlErrors;
use App\Models\Supplier;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Supplier::with(['banks', 'contacts']);

            if ($search = trim($request->input('search', ''))) {
                $query->where(function ($q) use ($search) {
                    $q->where('strSupplierName', 'LIKE', "%{$search}%")
                        ->orWhere('strSupplierNickName', 'LIKE', "%{$search}%")
                        ->orWhere('strAddress', 'LIKE', "%{$search}%");
                });
            }

            $suppliers = $query->orderBy('strSupplierName', 'asc')->get();

            return response()->json([
                'message'   => __('messages.retrieve_success', ['name' => 'Suppliers']),
                'suppliers' => $suppliers,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Suppliers');
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strSupplierName'     => 'required|string|max:100',
                'strSupplierNickName' => 'nullable|string|max:20',
                'strAddress'          => 'nullable|string|max:200',
                'strTIN'              => 'nullable|string|max:17',
                'bVAT'                => 'required|boolean',
                'bEWT'                => 'required|boolean',
                'cStatus'             => 'required|string|max:1',
            ]);

            $supplier = Supplier::create($validated);

            broadcast(new SupplierUpdated('created', $supplier->nSupplierId))->toOthers();

            return response()->json([
                'message'  => __('messages.create_success', ['name' => 'Supplier']),
                'supplier' => $supplier,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Supplier');
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strSupplierName'     => 'required|string|max:100',
                'strSupplierNickName' => 'nullable|string|max:20',
                'strAddress'          => 'nullable|string|max:200',
                'strTIN'              => 'nullable|string|max:17',
                'bVAT'                => 'required|boolean',
                'bEWT'                => 'required|boolean',
            ]);

            $supplier = Supplier::findOrFail($id);
            $supplier->update($validated);

            broadcast(new SupplierUpdated('updated', $supplier->nSupplierId))->toOthers();

            return response()->json([
                'message'  => __('messages.update_success', ['name' => 'Supplier']),
                'supplier' => $supplier,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Supplier');
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $supplier->contacts()->delete();
            $supplier->banks()->delete();
            $supplier->delete();

            broadcast(new SupplierUpdated('deleted', $id))->toOthers();

            return response()->json([
                'message'          => __('messages.delete_success', ['name' => 'Supplier']),
                'deleted_supplier' => $supplier,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Supplier');
        }
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'statusCode' => 'required|string|max:1',
            ]);

            $supplier = Supplier::findOrFail($id);
            $supplier->update(['cStatus' => $validated['statusCode']]);
            $supplier->refresh();

            broadcast(new SupplierUpdated('status_changed', $supplier->nSupplierId))->toOthers();

            return response()->json([
                'message'  => __('messages.update_success', ['name' => 'Supplier Status']),
                'supplier' => $supplier,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Supplier Status');
        }
    }

    public function allSuppliers(): JsonResponse
    {
        try {
            $statusCodes = array_keys(config('mappings.status_user'));

            $suppliers = Supplier::where('cStatus', $statusCodes[0])
                ->select('nSupplierId', 'strSupplierName', 'strSupplierNickName', 'bVAT', 'bEWT')
                ->orderBy('strSupplierName', 'asc')
                ->get();

            return response()->json([
                'message'   => __('messages.retrieve_success', ['name' => 'Active Suppliers']),
                'suppliers' => $suppliers,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Active Suppliers');
        }
    }

    private function handleException(Exception $e, string $messageKey, string $entityName): JsonResponse
    {
        SqlErrors::create([
            'dtDate'   => TimeHelper::now(),
            'strError' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => __("messages.{$messageKey}", ['name' => $entityName]),
            'error'   => $e->getMessage(),
        ], 500);
    }
}