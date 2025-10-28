<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\Transactions;
use App\Models\User;
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

            // The status should be DRAFT OF THE TRANSACTION
            if (!isset($validated['cProcStatus'])) {
                $validated['cProcStatus'] = '110'; // DRAFT TRANSACTION
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
    public function update(Request $request, $id)
    {
        try {
            // ✅ Find the existing transaction
            $transaction = Transactions::findOrFail($id);

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

            // // ✅ Assign default status if not provided
            // if (!isset($validated['cProcStatus'])) {
            //     $validated['cProcStatus'] = $transaction->cProcStatus ?? '110';
            // }

            // ✅ Update the record
            $transaction->update($validated);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction']),
                'transaction' => $transaction
            ], 200);

        } catch (Exception $e) {

            // ✅ Log SQL-related issue
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error updating transaction (ID: $id): " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Transaction']),
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function finalizetransaction(Request $request)
    {
        try {
            // ✅ Validate that a transaction ID is provided
            $validated = $request->validate([
                'id' => 'required|integer|exists:transactions,nTransactionId',
            ]);

            // ✅ Find the transaction
            $transaction = Transactions::findOrFail($validated['id']);

            // ✅ Update the status to finalized (example code: 999)
            $transaction->update([
                'cProcStatus' => '120', // You can adjust this code if you have a specific one for "Finalized"
            ]);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction finalized']),
                'transaction' => $transaction
            ], 200);

        } catch (Exception $e) {
            // ✅ Log SQL or runtime errors
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error finalizing transaction: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Finalize transaction']),
                'error'   => $e->getMessage()
            ], 500);
        }
    }


    // showing the individual data
    public function show(){

    }

    // deleting of data
    public function destroy(string $id){

    }

    public function assignAO(Request $request, $id)
{
    try {
        // ✅ Validate the assigned AO exists
        $validated = $request->validate([
            'nAssignedAO' => 'required|integer|exists:tblusers,nUserId',
        ]);

        // ✅ Find transaction by ID
        $transaction = Transactions::findOrFail($id);

        // ✅ Update AO assignment and status
        $transaction->update([
            'nAssignedAO' => $validated['nAssignedAO'],
            'cProcStatus' => '130', // Assignment of AO
        ]);

        return response()->json([
            'message' => __('messages.update_success', ['name' => 'Assigned Account Officer']),
            'transaction' => $transaction,
        ], 200);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $e->errors(),
        ], 422);

    } catch (\Exception $e) {
        // ✅ Log to SqlErrors table
        \App\Models\SqlErrors::create([
            'dtDate' => now(),
            'strError' => 'Error assigning AO: ' . $e->getMessage(),
        ]);

        return response()->json([
            'message' => __('messages.update_failed', ['name' => 'Assign AO']),
            'error' => $e->getMessage(),
        ], 500);
    }
}



}
