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
use App\Models\TransactionHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class TransactionController extends Controller
{
    public function index()
    {
        try {
            // Fetch all transactions with company, client, user, and latest history
            $transactions = Transactions::with(['company', 'client', 'user', 'latestHistory'])
                ->get()
                ->map(function ($txn) {
                    // Add a computed field for the latest status label
                    $latest = $txn->latestHistory;
                    return [
                        'nTransactionId' => $txn->nTransactionId,
                        'strCode' => $txn->strCode,
                        'cItemType' => $txn->cItemType,
                        'cProcMode' => $txn->cProcMode,
                        'cProcSource' => $txn->cProcSource,
                        'dTotalABC' => $txn->dTotalABC,
                        'dtPreBid' => $txn->dtPreBid,
                        'strPreBid_Venue' => $txn->strPreBid_Venue,
                        'dtDocIssuance' => $txn->dtDocIssuance,
                        'strDocIssuance_Venue' => $txn->strDocIssuance_Venue,
                        'dtDocSubmission' => $txn->dtDocSubmission,
                        'strDocSubmission_Venue' => $txn->strDocSubmission_Venue,
                        'dtDocOpening' => $txn->dtDocOpening,
                        'strDocOpening_Venue' => $txn->strDocOpening_Venue,
                        'strTitle' => $txn->strTitle,
                        'company' => $txn->company,
                        'client' => $txn->client,
                        'user' => $txn->user,
                        'current_status' => $latest?->nStatus ?? null,
                        'latest_history' => $latest,
                    ];
                });
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transactions']),
                'transactions' => $transactions,
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
    public function getHistory($id)
    {
        try {
            $history = TransactionHistory::where('nTransactionId', $id)
                ->with('user')
                ->orderBy('dtOccur', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'dtOccur' => $item->dtOccur,
                        'nStatus' => $item->nStatus,
                        'nUserId' => $item->user
                            ? $item->user->strFName . ' ' . $item->user->strLName
                            : 'System',
                        'strRemarks' => $item->strRemarks,
                    ];
                });
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transaction History']),
                'history' => $history,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Transaction History']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    // procurement - index
    public function indexProcurement(Request $request)
    {
        try {
            $userId = (int) $request->query('nUserId');
            // Fetch transactions with latest history only
            $transactions = Transactions::with(['company', 'client', 'latestHistory'])
                ->whereHas('latestHistory', function ($query) use ($userId) {
                    $query->whereIn('nStatus', ['110', '120', '310', '320'])
                        ->where(function ($q) use ($userId) {
                            $q->where(function ($q2) use ($userId) {
                                // 110, 120 & 310 → same user
                                $q2->whereIn('nStatus', ['110', '120', '310'])
                                    ->where('nUserId', $userId);
                            })->orWhere(function ($q2) use ($userId) {
                                // 120 & 320 → different user
                                $q2->whereIn('nStatus', ['120', '320'])
                                    ->where('nUserId', '!=', $userId);
                            });
                        });
                })
                ->get();
            // Ensure only one record per transaction (group by transaction ID)
            $transactions = $transactions->unique('nTransactionId')->values();
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transaction']),
                'transactions' => $transactions
            ], 200);
        } catch (Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching transactions: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Transaction']),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function indexAccountOfficer(Request $request)
    {
        try {
            $userId = (int) $request->query('nUserId');
            if (!$userId) {
                return response()->json([
                    'message' => __('messages.not_found', ['name' => 'User Id']),
                ], 400);
            }
            // Fetch transactions where nAssignedAO equals current AO
            $transactions = Transactions::with(['company', 'client', 'user', 'latestHistory'])
                ->where('nAssignedAO', $userId)
                ->get()
                ->map(function ($txn) {
                    $latest = $txn->latestHistory;
                    return [
                        'nTransactionId' => $txn->nTransactionId,
                        'strCode' => $txn->strCode,
                        'cItemType' => $txn->cItemType,
                        'cProcMode' => $txn->cProcMode,
                        'cProcSource' => $txn->cProcSource,
                        'dTotalABC' => $txn->dTotalABC,
                        'dtPreBid' => $txn->dtPreBid,
                        'strPreBid_Venue' => $txn->strPreBid_Venue,
                        'dtDocIssuance' => $txn->dtDocIssuance,
                        'strDocIssuance_Venue' => $txn->strDocIssuance_Venue,
                        'dtDocSubmission' => $txn->dtDocSubmission,
                        'strDocSubmission_Venue' => $txn->strDocSubmission_Venue,
                        'dtDocOpening' => $txn->dtDocOpening,
                        'strDocOpening_Venue' => $txn->strDocOpening_Venue,
                        'strTitle' => $txn->strTitle,
                        'company' => $txn->company,
                        'client' => $txn->client,
                        'user' => $txn->user,
                        'current_status' => $latest?->nStatus ?? null,
                        'latest_history' => $latest,
                    ];
                });
            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transactions']),
                'transactions' => $transactions,
            ], 200);
        } catch (\Exception $e) {
            SqlErrors::create([
                'dtDate' => now(),
                'strError' => "Error fetching AO transactions: " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Transactions']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    // procurement = changing the status for verifying the transaction
    public function finalizetransaction(Request $request, $id)
    {
        try {
            // ✅ Find the transaction by ID
            $transaction = Transactions::findOrFail($id);
            $userId = $request->input('userId');
            $remarks = $request->input('remarks'); // for remarks
            if (!$userId) {
                return response()->json(['message' => __('messages.not_found', ['name' => 'User Id'])], 400);
            }
            // ✅ Define the new status
            $newStatus = '120'; // Finalized (To Verify)
            // ✅ Record the change in transaction history
            TransactionHistory::create([
                'nTransactionId' => $id,
                'nUserId' => $userId,
                'nStatus' => $newStatus,
                'strRemarks' => $remarks,
                'dtOccur' => now(),
            ]);
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
    // procurement = changing the status for assigning AO to the transaction
    public function verifytransaction(Request $request, $id)
    {
        try {
            // ✅ Find the transaction by ID
            $transaction = Transactions::findOrFail($id);
            // 🧠 Get the user ID from the request payload
            $userId = $request->input('userId');
            $remarks = $request->input('remarks');
            if (!$userId) {
                return response()->json(['message' => __('messages.not_found', ['name' => 'User Id'])], 400);
            }
            // ✅ Record the change in transaction history
            TransactionHistory::create([
                'nTransactionId' => $id,
                'nUserId' => $userId,
                'nStatus' => '130',
                'strRemarks' => $remarks,
                'dtOccur' => now(),
            ]);
            Log::info("Transaction verified", [
                'transaction_id' => $id,
                'user_id' => $userId,
            ]);
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction Verified']),
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
                'strError' => "Error verifying transaction (ID: $id): " . $e->getMessage(),
            ]);
            return response()->json([
                'message' => __('messages.update_failed', ['name' => 'Verified Transaction']),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    // adding of the transaction from the procurement
    public function store(Request $request)
    {
        try {
            // ✅ Validate input
            $validated = $request->validate([
                'nCompanyId'              => 'required|integer',
                'nClientId'               => 'required|integer',
                'strTitle'                => 'required|string|max:255',
                'strRefNumber'            => 'nullable|string|max:100',
                'dTotalABC'               => 'nullable|numeric',
                'cProcMode'               => 'nullable|string|max:50',
                'cItemType'               => 'nullable|string|max:50',
                'strCode'                 => 'nullable|string|max:50',
                'cProcSource'             => 'nullable|string|max:50',
                'dtPreBid'                => 'nullable|date',
                'strPreBid_Venue'         => 'nullable|string|max:255',
                'dtDocIssuance'           => 'nullable|date',
                'strDocIssuance_Venue'    => 'nullable|string|max:255',
                'dtDocSubmission'         => 'nullable|date',
                'strDocSubmission_Venue'  => 'nullable|string|max:255',
                'dtDocOpening'            => 'nullable|date',
                'strDocOpening_Venue'     => 'nullable|string|max:255',
                'nUserId' => 'required',
            ]);
            // ✅ Create transaction
            $transaction = Transactions::create($validated);
            // ✅ Add transaction history
            TransactionHistory::create([
                'nTransactionId' =>  $transaction->nTransactionId,
                'dtOccur' => now(),
                'nStatus' => '110',
                'nUserId' => $validated['nUserId'],
                'strRemarks' => null,
            ]);
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
                'strTitle'                => 'required|string|max:255',
                'strRefNumber'            => 'nullable|string|max:100',
                'dTotalABC'               => 'nullable|numeric',
                'cProcMode'               => 'nullable|string|max:50',
                'cItemType'               => 'nullable|string|max:50',
                'strCode'                 => 'nullable|string|max:50',
                'cProcSource'             => 'nullable|string|max:50',
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
    public function revert(Request $request, $id)
    {
        try {
            // ✅ Find the transaction
            $transaction = Transactions::findOrFail($id);
            // ✅ Get latest status from TransactionHistory
            $latestHistory = $transaction->histories()->latest('dtOccur')->first();
            if (!$latestHistory) {
                return response()->json([
                    'message' => __('messages.not_found', ['name' => 'Transaction']),
                ], 404);
            }
            $currentStatus = $latestHistory->nStatus;
            // ✅ Load status flow from config
            $statusFlow = config('mappings.status_transaction');
            $codes = array_keys($statusFlow);
            $currentIndex = array_search($currentStatus, $codes);
            // 🚫 Prevent revert if already at the first stage
            if ($currentIndex === false || $currentIndex === 0) {
                return response()->json([
                    'message' =>  __('messages.revert_blocked'),
                ], 400);
            }
            // ✅ Determine previous status
            $previousStatus = $codes[$currentIndex - 1];
            $currentStatus = $codes[$currentIndex];
            // ✅ Find the most recent history with that status
            $previousHistory = $transaction->histories()
                ->where('nStatus', $previousStatus)
                ->latest('dtOccur')
                ->first();
            $previousUserId = $previousHistory ? $previousHistory->nUserId : auth()->id();
            $remarks = $request->input('remarks');
            // ✅ Log the revert action
            TransactionHistory::create([
                'nTransactionId' => $id,
                'nUserId' => $previousUserId,
                'nStatus' => $previousStatus,
                'strRemarks' => $remarks ?? null,
                'dtOccur' => now(),
            ]);
            // ✅ Handle Account Officer assignment logic
            if ((int)$currentStatus === 210) {
                // If reverted to 210, clear AO assignment
                $transaction->nAssignedAO = null;
            } else {
                // Otherwise, restore AO to the previous user
                $transaction->nAssignedAO = $previousUserId;
            }
            $transaction->save();
            return response()->json([
                'message' => __('messages.update_success', ['name' => 'Transaction Reverted']),
                'transaction' => $transaction,
                'previous_status' => $previousStatus,
                'previous_status_label' => $statusFlow[$previousStatus] ?? $previousStatus,
                'previous_user_id' => $previousUserId,
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
    // showing the individual data
    public function show() {}
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
    // Procurement - TL | Management
    public function assignAO(Request $request, $id)
    {
        try {
            // ✅ Validate the assigned AO exists
            $validated = $request->validate([
                'nAssignedAO' => 'required|integer|exists:tblusers,nUserId',
                'user_id' => 'required|integer|exists:tblusers,nUserId', // user performing the action
                'remarks' => 'nullable|string|max:255',
            ]);
            // ✅ Find the transaction
            $transaction = Transactions::findOrFail($id);
            // ✅ Update AO assignment and status
            $transaction->update([
                'nAssignedAO' => $validated['nAssignedAO'],
            ]);
            // ✅ Create Transaction History
            TransactionHistory::create([
                'nTransactionId' => $transaction->nTransactionId,
                'dtOccur' => now(),
                'nStatus' => 210, // Same as cProcStatus (AO Assigned)
                'nUserId' => $validated['user_id'], // user who assigned AO
                'strRemarks' => $validated['remarks'] ?? 'Assigned Account Officer',
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
            // ✅ Log to SqlErrors table for traceability
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
    // public function revert($id)
    // {
    //     try {
    //         // Find the transaction
    //         $transaction = Transactions::findOrFail($id);
    //         $currentStatus = $transaction->cProcStatus;
    //         $statusFlow = config('mappings.status_transaction');
    //         $codes = array_keys($statusFlow);
    //         $currentIndex = array_search($currentStatus, $codes);
    //         if ($currentIndex === false || $currentIndex === 0) {
    //             return response()->json([
    //                 'message' => 'This transaction is already at its initial stage and cannot be reverted.',
    //             ], 400);
    //         }
    //         $previousStatus = $codes[$currentIndex - 1];
    //         // ✅ If reverting from Assigned AO (130) → Finalized (120)
    //         if ($currentStatus === '210') {
    //             $transaction->nAssignedAO = null;
    //         }
    //         $transaction->cProcStatus = $previousStatus;
    //         $transaction->save();
    //         return response()->json([
    //             'message' => __('messages.update_success', ['name' => 'Transaction Reverted']),
    //             'transaction' => $transaction,
    //             'previous_status' => $previousStatus,
    //             'previous_status_label' => $statusFlow[$previousStatus],
    //         ], 200);
    //     } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    //         return response()->json([
    //             'message' => 'Transaction not found.',
    //             'error' => $e->getMessage(),
    //         ], 404);
    //     } catch (\Exception $e) {
    //         \App\Models\SqlErrors::create([
    //             'dtDate' => now(),
    //             'strError' => "Error reverting transaction (ID: $id): " . $e->getMessage(),
    //         ]);
    //         return response()->json([
    //             'message' => __('messages.update_failed', ['name' => 'Revert Transaction']),
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }
  public function getPricingModalData($id)
{
    try {
        // Load transaction with related items and purchase options
        $transaction = Transactions::with([
            'transactionItems.itemPricings.pricingSet', // optional for selling price
            'transactionItems.purchaseOptions',        // purchase options
        ])->findOrFail($id);
        $transactionTotalABC = $transaction->dTotalABC ?? 0;
        // Separate items with ABC set and ABC null
        $itemsWithABC = $transaction->transactionItems->filter(fn($i) => $i->dUnitABC !== null);
        $itemsWithoutABC = $transaction->transactionItems->filter(fn($i) => $i->dUnitABC === null);
        $sumSetABC = $itemsWithABC->sum('dUnitABC');
        $remainingABC = max($transactionTotalABC - $sumSetABC, 0);
        $countUnset = $itemsWithoutABC->count();
        $abcPerUnset = $countUnset ? $remainingABC / $countUnset : 0;
        // Map items
        $formatted = [
            'transactionName' => $transaction->strTitle,
            'transactionId'   => $transaction->strCode,
            'totalABC'        => $transactionTotalABC,
            'items' => $transaction->transactionItems->map(function ($item) use ($abcPerUnset) {
                $firstPricing = $item->itemPricings->first(); // For selling price
                // Get the first included purchase option's unit price
                $purchasePrice = $item->purchaseOptions
                    ->where('bIncluded', 1)
                    ->sortBy('dUnitPrice')
                    ->first()?->dUnitPrice ?? 0;
                // Use existing ABC or distributed ABC
                $itemABC = $item->dUnitABC ?? $abcPerUnset;
                return [
                    'id'            => $item->nTransactionItemId,
                    'name'          => $item->strName,
                    'qty'           => $item->nQuantity,
                    'purchasePrice' => $purchasePrice,
                    'sellingPrice'  => $firstPricing ? $firstPricing->dUnitSellingPrice : 0,
                    'abc'           => $itemABC,
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
