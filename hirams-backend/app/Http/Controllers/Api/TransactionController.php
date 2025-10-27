<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\Transactions;
use App\Models\SqlErrors;

class TransactionController extends Controller
{
    // showing of all data
    public function index(){
         try {
            $transactions = Transactions::with(['company', 'client'])->get();

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transactions']),
                'transactions' => $transactions
            ], 200);

        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching transactions: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Transactions']),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {

            // ✅ Validate input
            $validated = $request->validate([
                'nCompanyId'              => 'required|integer',
                'nClientId'               => 'required|integer',
                // 'nAssignedAO'             => 'nullable|integer',
                'strTitle'                => 'required|string|max:255',
                'strRefNumber'            => 'nullable|string|max:100',
                'dTotalABC'               => 'nullable|numeric',
                'cProcMode'               => 'nullable|string|max:50',
                'cItemType'               => 'nullable|string|max:50',
                'strCode'                 => 'nullable|string|max:50',
                'cProcSource'             => 'nullable|string|max:50',
                'cProcStatus'             => 'nullable|string|max:10', // status field

                'dtPreBid'                => 'nullable|date',
                'strPreBid_Venue'         => 'nullable|string|max:255',
                'dtDocIssuance'           => 'nullable|date',
                'strDocIssuance_Venue'    => 'nullable|string|max:255',
                'dtDocSubmission'         => 'nullable|date',
                'strDocSubmission_Venue'  => 'nullable|string|max:255',
                'dtDocOpening'            => 'nullable|date',
                'strDocOpening_Venue'     => 'nullable|string|max:255',
            ]);

            // ✅ Assign default initial status if not provided
            if (!isset($validated['cProcStatus'])) {
                $validated['cProcStatus'] = '110'; // Starting step: AO Assignment
            }

            // ✅ Insert record
            $transaction = Transactions::create($validated);

            return response()->json([
                'message' => __('messages.store_success', ['name' => 'Transaction']),
                'transaction' => $transaction
            ], 201);

        } catch (Exception $e) {

            // ✅ Log SQL-related issue
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error inserting new transaction: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.store_failed', ['name' => 'Transaction']),
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // updating of the data
    public function update(Request $request, $id){

    }

    // showing the individual data
    public function show(){

    }

    // deleting of data
    public function destroy(string $id){

    }
}
