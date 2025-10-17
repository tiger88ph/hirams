<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\Company;
use App\Models\SqlErrors;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $companies = Company::all();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Company']),
                'companies' => $companies
            ], 200);

        } catch (Exception $e) {
            // Log error to sqlerrors table
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching companies: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Company']),
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
                'strCompanyName' => 'required|string|max:50',
                'strCompanyNickName' => 'nullable|string|max:20',
                'strTIN' => 'nullable|string|max:15',
                'strAddress' => 'nullable|string|max:200',
                'bVAT' => 'required|boolean',
                'bEWT' => 'required|boolean',
            ]);

            // Create company record
            $company = Company::create($data);

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Company']),
                'company' => $company
            ], 201);

        } catch (Exception $e) {
            // Log error to sqlerrors table
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error creating company: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.create_failed', ['name' => 'Company']),
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
            // Find company record
            $company = Company::findOrFail($id);

            // Validate request data
            $data = $request->validate([
                'strCompanyName' => 'required|string|max:50',
                'strCompanyNickName' => 'nullable|string|max:20',
                'strTIN' => 'nullable|string|max:15',
                'strAddress' => 'nullable|string|max:200',
                'bVAT' => 'required|boolean',
                'bEWT' => 'required|boolean',
            ]);

            // Update company
            $company->update($data);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Company']),
                'company' => $company
            ], 200);

        } catch (ModelNotFoundException $e) {
            // Optionally log "not found" errors
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Company ID $id not found: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Company'])
            ], 404);

        } catch (Exception $e) {
            // Log any other error
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating Company ID $id: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Company']),
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
            $company = Company::findOrFail($id);
            $company->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Company']),
                'deleted_company' => $company
            ], 200);

        } catch (ModelNotFoundException $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => 'Company ID ' . $id . ' not found: ' . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Company'])
            ], 404);

        } catch (Exception $e) {
            // ✅ Use Eloquent to log SQL error
            try {
                SqlErrors::create([
                    'dtDate' => now(),
                    'strError' => 'Error deleting company ID ' . $id . ': ' . $e->getMessage(),
                ]);
            } catch (Exception $logError) {
                Log::error('Failed to log SQL error: ' . $logError->getMessage());
            }

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Company']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
