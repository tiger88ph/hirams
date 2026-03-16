<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Events\CompanyUpdated;
use App\Models\Company;
use App\Models\SqlErrors;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Get all companies with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Company::query();

            if ($search = trim($request->query('search', ''))) {
                $query->where(function ($q) use ($search) {
                    $q->where('strCompanyName', 'LIKE', "%{$search}%")
                        ->orWhere('strAddress', 'LIKE', "%{$search}%");
                });
            }

            $companies = $query->orderBy('strCompanyName', 'asc')->get();

            return response()->json([
                'message'   => __('messages.retrieve_success', ['name' => 'Companies']),
                'companies' => $companies,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Companies');
        }
    }

    /**
     * Create a new company
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strCompanyName'     => 'required|string|max:50',
                'strCompanyNickName' => 'nullable|string|max:20',
                'strTIN'             => 'nullable|string|max:17',
                'strAddress'         => 'nullable|string|max:200',
                'bVAT'               => 'required|boolean',
                'bEWT'               => 'required|boolean',
            ]);

            $company = Company::create($validated);

            broadcast(new CompanyUpdated('created', $company->nCompanyId))->toOthers();

            return response()->json([
                'message' => __('messages.create_success', ['name' => 'Company']),
                'company' => $company,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'create_failed', 'Company');
        }
    }

    /**
     * Update an existing company
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'strCompanyName'     => 'required|string|max:50',
                'strCompanyNickName' => 'nullable|string|max:20',
                'strTIN'             => 'nullable|string|max:17',
                'strAddress'         => 'nullable|string|max:200',
                'bVAT'               => 'required|boolean',
                'bEWT'               => 'required|boolean',
            ]);

            $company = Company::findOrFail($id);
            $company->update($validated);

            broadcast(new CompanyUpdated('updated', $company->nCompanyId))->toOthers();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Company']),
                'company' => $company,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Company']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Company');
        }
    }

    /**
     * Delete a company
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);
            $company->delete();

            broadcast(new CompanyUpdated('deleted', $id))->toOthers();

            return response()->json([
                'message'         => __('messages.delete_success', ['name' => 'Company']),
                'deleted_company' => $company,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Company']),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Company');
        }
    }

    /**
     * Centralized exception handling
     */
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