<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\SqlErrors;
use App\Models\Client;
class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $search = $request->query('search');
            $status = $request->query('status'); // expected values: A, I, P or empty
            $query = Client::query();
            // Search filter
            if (!empty($search)) {
                $search = trim($search);
                $query->where(function ($q) use ($search) {
                    $q->where('strClientName', 'LIKE', "%{$search}%")
                        ->orWhere('strAddress', 'LIKE', "%{$search}%")
                        ->orWhere('strContactPerson', 'LIKE', "%{$search}%");
                });
            }
            // Status filter (A = Active, I = Inactive, P = Pending)
            if (!empty($status)) {
                $query->where('cStatus', $status);
            }
            $clients = $query->orderBy('strClientName', 'asc')->get();
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Clients']),
                'clients' => $clients
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching clients: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Clients']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Store a newly created resource in storage
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'strClientName' => 'required|string|max:100',
                'strClientNickName' => 'nullable|string|max:25',
                'strTIN' => 'nullable|string|max:15',
                'strAddress' => 'nullable|string|max:200',
                'strBusinessStyle' => 'nullable|string|max:20',
                'strContactPerson' => 'nullable|string|max:40',
                'strContactNumber' => 'nullable|string|max:50',
                'cStatus' => 'required|string|max:1', // ⭐ add this
            ]);
            $client = Client::create($data);
            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Client']),
                'client' => $client
            ], 201);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating client: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Client']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $client = Client::findOrFail($id);
            $data = $request->validate([
                'strClientName' => 'required|string|max:100',
                'strClientNickName' => 'nullable|string|max:25',
                'strTIN' => 'nullable|string|max:15',
                'strAddress' => 'nullable|string|max:200',
                'strBusinessStyle' => 'nullable|string|max:20',
                'strContactPerson' => 'nullable|string|max:40',
                'strContactNumber' => 'nullable|string|max:50',
            ]);
            $client->update($data);
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Client']),
                'client' => $client
            ], 200);
        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Client ID $id not found: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client'])
            ], 404);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating Client ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Client']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Update only the client's status.
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $client = Client::findOrFail($id);
            $data = $request->validate([
                'cStatus' => 'required|in:A,I,P', // A=Active, I=Inactive, P=Pending
            ]);
            $client->update(['cStatus' => $data['cStatus']]);
            $client->refresh(); // ✅ make sure we return the updated value
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Client Status']),
                'client' => $client
            ], 200);
        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Client ID $id not found for status update: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client'])
            ], 404);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating status for Client ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Client Status']),
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
            $client = Client::findOrFail($id);
            $client->delete();
            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Client']),
                'deleted_client' => $client
            ], 200);
        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Client ID $id not found: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client'])
            ], 404);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error deleting Client ID $id: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Client']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Active Clients for the displaying to Transaction in Procurement
     */
    public function activeClients()
    {
        try {
            $clients = Client::where('cStatus', 'A')
                ->orderBy('strClientName', 'asc')
                ->get();
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Active Clients']),
                'clients' => $clients
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching active clients: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Active Clients']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
