<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Events\ClientUpdated;
use App\Models\Client;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Client::query();

            if ($search = trim($request->query('search', ''))) {
                $query->where(function ($q) use ($search) {
                    $q->where('strClientName', 'LIKE', "%{$search}%")
                        ->orWhere('strAddress', 'LIKE', "%{$search}%")
                        ->orWhere('strContactPerson', 'LIKE', "%{$search}%");
                });
            }

            if ($status = $request->query('status')) {
                $query->where('cStatus', $status);
            }

            $clients = $query->orderBy('strClientName', 'asc')->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Clients']),
                'clients' => $clients,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Clients');
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strClientName'     => 'required|string|max:100',
                'strClientNickName' => 'nullable|string|max:25',
                'strTIN'            => 'nullable|string|max:17',
                'strAddress'        => 'nullable|string|max:200',
                'strBusinessStyle'  => 'nullable|string|max:20',
                'strContactPerson'  => 'nullable|string|max:40',
                'strContactNumber'  => 'nullable|string|max:50',
                'cStatus'           => 'required|string|max:1',
            ]);

            $client = Client::create($validated);

            broadcast(new ClientUpdated('created', $client->nClientId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Client']),
                'client'  => $client,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Client');
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strClientName'     => 'required|string|max:100',
                'strClientNickName' => 'nullable|string|max:25',
                'strTIN'            => 'nullable|string|max:17',
                'strAddress'        => 'nullable|string|max:200',
                'strBusinessStyle'  => 'nullable|string|max:20',
                'strContactPerson'  => 'nullable|string|max:40',
                'strContactNumber'  => 'nullable|string|max:50',
            ]);

            $client = Client::findOrFail($id);
            $client->update($validated);

            broadcast(new ClientUpdated('updated', $client->nClientId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Client']),
                'client'  => $client,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Client');
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);
            $client->delete();

            broadcast(new ClientUpdated('deleted', $id))->toOthers();

            return response()->json([
                'message'        => __('messages.delete_success', ['name' => 'Client']),
                'deleted_client' => $client,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Client');
        }
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'cStatus' => 'required|string|max:1',
            ]);

            $client = Client::findOrFail($id);
            $client->update(['cStatus' => $validated['cStatus']]);
            $client->refresh();

            broadcast(new ClientUpdated('status_changed', $client->nClientId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Client Status']),
                'client'  => $client,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Client']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Client Status');
        }
    }

    public function activeClients(): JsonResponse
    {
        try {
            $statusCodes = array_keys(config('mappings.status_client'));

            $clients = Client::where('cStatus', $statusCodes[0])
                ->orderBy('strClientName', 'asc')
                ->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Active Clients']),
                'clients' => $clients,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Active Clients');
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