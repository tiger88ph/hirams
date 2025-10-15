<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;

class ClientController extends Controller
{
     /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $client = Client::all();
        return response()->json($client);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'strClientName' => 'required|string|max:100',
            'strClientNickName' => 'required|string|max:25',
            'strTIN' => 'nullable|string|max:15',
            'strAddress' => 'nullable|string|max:200',
            'strBusinessStyle' => 'nullable|string|max:20',
            'strContactPerson' => 'nullable|string|max:40',
            'strContactNumber' => 'nullable|string|max:50',
        ]);

        $client = Client::create($data);
        return response()->json($client, 201);
    }

     /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);

        $data = $request->validate([
            'strClientName' => 'required|string|max:100',
            'strClientNickName' => 'required|string|max:25',
            'strTIN' => 'nullable|string|max:15',
            'strAddress' => 'nullable|string|max:200',
            'strBusinessStyle' => 'nullable|string|max:20',
            'strContactPerson' => 'nullable|string|max:40',
            'strContactNumber' => 'nullable|string|max:50',
        ]);

        $client->update($data);

        return response()->json($client, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            // Find user by ID
            $client = Client::findOrFail($id);

            // Delete the record
            $client->delete();

            // Return success response
            return response()->json([
                'message' => 'Client deleted successfully.',
                'deleted_client' => $client
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // If user not found
            return response()->json([
                'message' => 'Client not found.'
            ], 404);

        } catch (\Exception $e) {
            // Catch other errors
            return response()->json([
                'message' => 'Failed to delete client.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
