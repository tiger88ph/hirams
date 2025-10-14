<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $companies = Company::all();
        return response()->json($companies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'strCompanyName' => 'required|string|max:50',
            'strCompanyNickName' => 'nullable|string|max:20',
            'strTIN' => 'nullable|string|max:15',
            'strAddress' => 'nullable|string|max:200',
            'bVAT' => 'required|boolean',
            'bEWT' => 'required|boolean',
        ]);

        $company = Company::create($data);
        return response()->json($company, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

  
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $data = $request->validate([
            'strCompanyName' => 'required|string|max:50',
            'strCompanyNickName' => 'nullable|string|max:20',
            'strTIN' => 'nullable|string|max:15',
            'strAddress' => 'nullable|string|max:200',
            'bVAT' => 'required|boolean',
            'bEWT' => 'required|boolean',
        ]);

        $company->update($data);

        return response()->json($company, 200);
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            // Find company by ID
            $company = Company::findOrFail($id);

            // Delete the record
            $company->delete();

            // Return success response
            return response()->json([
                'message' => 'Company deleted successfully.',
                'deleted_company' => $company
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // If company not found
            return response()->json([
                'message' => 'Company not found.'
            ], 404);

        } catch (\Exception $e) {
            // Catch other errors
            return response()->json([
                'message' => 'Failed to delete company.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
