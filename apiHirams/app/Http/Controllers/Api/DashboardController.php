<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\User;
use App\Models\Client;
use App\Models\Company;
use App\Models\SqlErrors;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Supplier;

class DashboardController extends Controller
{
    public function totalMetrics(Request $request)
    {
        try {
            $status = array_keys(config('mappings.status_user'));

            $totalUsers = User::where('cStatus', $status[0])->count();
            $totalCompanies = Company::count();
            $totalClients = Client::where('cStatus', $status[0])->count();
            $totalSuppliers = Supplier::where('cStatus', $status[0])->count();

            return response()->json([
                'message' => 'Dashboard totals retrieved successfully',
                'totals' => [
                    'users' => $totalUsers,
                    'companies' => $totalCompanies,
                    'clients' => $totalClients,
                    'suppliers' => $totalSuppliers,
                ]
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error retrieving dashboard totals: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve dashboard totals',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
