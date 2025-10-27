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

    // inserting data
    public function store(Request $request){

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
