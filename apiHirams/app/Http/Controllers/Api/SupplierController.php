<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\SqlErrors;
class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $search = $request->input('search');
            $query = Supplier::with(['banks', 'contacts']);
            // 🔍 Search: company name or nickname
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('strSupplierName', 'LIKE', "%{$search}%")
                        ->orWhere('strSupplierNickName', 'LIKE', "%{$search}%")
                        ->orWhere('strAddress', 'LIKE', "%{$search}%");
                });
            }
            $suppliers = $query->get();
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier']),
                'suppliers' => $suppliers
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching suppliers: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Supplier']),
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
                'strSupplierName' => 'required|string|max:100',
                'strSupplierNickName' => 'nullable|string|max:20',
                'strAddress' => 'nullable|string|max:200',
                'strTIN' => 'nullable|string|max:17',
                'bVAT' => 'required|boolean',
                'bEWT' => 'required|boolean',
                'cStatus' => 'required|in:A,P,I', // validate frontend value
            ]);
            $supplier = Supplier::create($data);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating supplier: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Supplier']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id,)
    {
        //
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Find supplier record
            $supplier = Supplier::findOrFail($id);
            // Validate request data
            $data = $request->validate([
                'strSupplierName' => 'required|string|max:100',
                'strSupplierNickName' => 'nullable|string|max:20',
                'strAddress' => 'nullable|string|max:200',
                'strTIN' => 'nullable|string|max:17',
                'bVAT' => 'required|boolean',
                'bEWT' => 'required|boolean',
            ]);
            // Update supplier
            $supplier->update($data);
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Supplier']),
                'supplier' => $supplier
            ], 200);
        } catch (ModelNotFoundException $e) {
            // Optionally log "not found" errors
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Company ID $id not found: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier'])
            ], 404);
        } catch (Exception $e) {
            // Log any other error
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating Company ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Supplier']),
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
            $supplier = Supplier::findOrFail($id);
            // Delete related contacts
            $supplier->contacts()->delete();
            // Delete related banks
            $supplier->banks()->delete();
            // Delete the supplier
            $supplier->delete();
            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Supplier']),
                'deleted_supplier' => $supplier
            ], 200);
        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => 'Supplier ID ' . $id . ' not found: ' . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier'])
            ], 404);
        } catch (Exception $e) {
            // ✅ Use Eloquent to log SQL error
            try {
                SqlErrors::create([
                    'dtDate' => now(),
                    'strError' => 'Error deleting supplier ID ' . $id . ': ' . $e->getMessage(),
                ]);
            } catch (Exception $logError) {
                Log::error('Failed to log SQL error: ' . $logError->getMessage());
            }
            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Supplier']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Get all suppliers for dropdowns (minimal fields)
     */
    /**
     * Get all suppliers for dropdowns (with minimal details)
     */
    public function allSuppliers()
    {
        try {
            // Select only active suppliers
            $suppliers = Supplier::where('cStatus', 'A')   // ✅ Only Active
                ->select('nSupplierId', 'strSupplierName', 'bVAT', 'bEWT')
                ->get();
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Supplier']),
                'suppliers' => $suppliers
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching suppliers: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Supplier']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function updateStatus(Request $request, $id)
    {
        try {
            // Find supplier by ID
            $supplier = Supplier::findOrFail($id);
            // Validate input
            $data = $request->validate([
                'statusCode' => 'required|in:A,I,P', // A=Active, I=Inactive, P=Pending
            ]);
            // Update status
            $supplier->update(['cStatus' => $data['statusCode']]);
            // Refresh to get latest data
            $supplier->refresh();
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Supplier Status']),
                'supplier' => $supplier
            ], 200);
        } catch (ModelNotFoundException $e) {
            // Log the error
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Supplier ID $id not found for status update: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Supplier'])
            ], 404);
        } catch (Exception $e) {
            // Log general exceptions
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating status for Supplier ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Supplier Status']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
