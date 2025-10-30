<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\Transactions;
use App\Models\User;
use App\Models\SqlErrors;
use App\Models\PricingSet;
use App\Models\TransactionItems;
use App\Models\PurchaseOptions;
use App\Models\ItemPricings;

class TransactionController extends Controller
{
    // showing of all data
    public function index(){
         try {
            $transactions = Transactions::with(['company', 'client', 'user'])->get();

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

    public function indexProcurement(){
        try {
            $allowedStatus = ['110', '120', '310', '320']; // Drafted & Finalized

            $transactions = Transactions::with(['company', 'client'])
                ->whereIn('cProcStatus', $allowedStatus)
                ->get();

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

    public function finalizetransaction(Request $request, $id)
    {
        try {
            // ✅ Find the transaction by ID
            $transaction = Transactions::findOrFail($id);

            // 🚀 Update the status to "Finalize Transaction" (code 120)
            $transaction->update(['cProcStatus' => '120']);

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction Finalized']),
                'transaction' => $transaction,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found.',
                'error' => $e->getMessage(),
            ], 404);

        } catch (\Exception $e) {
            // 🧾 Log SQL or runtime errors
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error finalizing transaction (ID: $id): " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Finalize Transaction']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    // showing the individual data
    public function show(){

    }

    public function destroy(string $id)
    {
        try {
            // ✅ Find the transaction (throws 404 if not found)
            $transaction = Transactions::findOrFail($id);

            // ✅ Check for existing linked records before deleting
            $hasItems = TransactionItems::where('nTransactionId', $transaction->nTransactionId)->exists();
            $hasPricingSets = PricingSet::where('nTransactionId', $transaction->nTransactionId)->exists();

            // Check for any linked itemPricings or purchaseOptions indirectly
            $hasItemPricings = ItemPricings::whereHas('transactionItem', function ($query) use ($transaction) {
                $query->where('nTransactionId', $transaction->nTransactionId);
            })->orWhereHas('pricingSet', function ($query) use ($transaction) {
                $query->where('nTransactionId', $transaction->nTransactionId);
            })->exists();

            $hasPurchaseOptions = PurchaseOptions::whereHas('transactionItem', function ($query) use ($transaction) {
                $query->where('nTransactionId', $transaction->nTransactionId);
            })->exists();

            // ✅ If any related records exist, block deletion
            if ($hasItems || $hasPricingSets || $hasItemPricings || $hasPurchaseOptions) {
                return response()->json([
                    'message' => __('messages.delete_blocked', ['name' => 'Transaction']),
                    'warning' => 'Cannot delete this transaction because it still has linked items, pricing sets, or purchase options.',
                ], 409);
            }

            // ✅ Proceed to delete only if there are no linked records
            $transaction->delete();

            return response()->json([
                'message' => __('messages.delete_success', ['name' => 'Transaction']),
                'transactionId' => $id,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Transaction']),
                'error'   => $e->getMessage(),
            ], 404);

        } catch (\Exception $e) {
            // ✅ Log the error for audit trail
            \App\Models\SqlErrors::create([
                'dtDate'   => now(),
                'strError' => "Error deleting transaction ID {$id}: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.delete_failed', ['name' => 'Transaction']),
                'error'   => $e->getMessage(),
            ], 500);
        }
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

    public function revert($id)
    {
        try {
            // Find the transaction
            $transaction = Transactions::findOrFail($id);

            $currentStatus = $transaction->cProcStatus;
            $statusFlow = config('mappings.status_transaction');
            $codes = array_keys($statusFlow);

            $currentIndex = array_search($currentStatus, $codes);

            if ($currentIndex === false || $currentIndex === 0) {
                return response()->json([
                    'message' => 'This transaction is already at its initial stage and cannot be reverted.',
                ], 400);
            }

            $previousStatus = $codes[$currentIndex - 1];

            // ✅ If reverting from Assigned AO (130) → Finalized (120)
            if ($currentStatus === '130') {
                $transaction->nAssignedAO = null;
            }

            $transaction->cProcStatus = $previousStatus;
            $transaction->save();

            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction Reverted']),
                'transaction' => $transaction,
                'previous_status' => $previousStatus,
                'previous_status_label' => $statusFlow[$previousStatus],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found.',
                'error' => $e->getMessage(),
            ], 404);

        } catch (\Exception $e) {
            \App\Models\SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error reverting transaction (ID: $id): " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Revert Transaction']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPricingModalData($id)
    {
        try {
            // Load transaction with related items and purchase options
            $transaction = Transactions::with([
                'transactionItems.itemPricings.pricingSet', // optional for selling price
                'transactionItems.purchaseOptions',        // purchase options
            ])->findOrFail($id);

            // Map items
            $formatted = [
                'transactionName' => $transaction->strTitle,
                'transactionId'   => $transaction->strCode,
                'items' => $transaction->transactionItems->map(function ($item) {
                    $firstPricing = $item->itemPricings->first(); // For selling price

                    // ✅ Get the first included purchase option's unit price
                    $purchasePrice = $item->purchaseOptions
                        ->where('bIncluded', 1)         // only include selected options
                        ->sortBy('dUnitPrice')          // pick the cheapest unit price
                        ->first()?->dUnitPrice ?? 0;   // fallback to 0 if none

                    return [
                        'id'            => $item->nTransactionItemId,
                        'name'          => $item->strName,
                        'qty'           => $item->nQuantity,
                        'purchasePrice' => $purchasePrice,                  // <-- updated here
                        'sellingPrice'  => $firstPricing ? $firstPricing->dUnitSellingPrice : 0,
                        'abc'           => $item->dUnitABC ?? 0,
                        'pricingSet'    => $firstPricing && $firstPricing->pricingSet ? $firstPricing->pricingSet->strName : null,
                        'purchaseOptions' => $item->purchaseOptions->map(function ($option) {
                            return [
                                'id'        => $option->nPurchaseOptionId,
                                'supplierId'=> $option->nSupplierId,
                                'qty'       => $option->nQuantity,
                                'unitPrice' => $option->dUnitPrice,
                                'uom'       => $option->strUOM,
                                'brand'     => $option->strBrand,
                                'model'     => $option->strModel,
                                'included'  => (bool)$option->bIncluded,
                            ];
                        }),
                    ];
                }),
            ];

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Pricing data']),
                'transaction' => $formatted,
            ], 200);

        } catch (\Exception $e) {
            // Log SQL error
            \App\Models\SqlErrors::create([
                'dtDate'   => now(),
                'strError' => "Error fetching pricing modal data: " . $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Pricing data']),
                'error'   => $e->getMessage(),
            ], 500);
        }
    }









}
