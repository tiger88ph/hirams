<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TimeHelper;
use App\Http\Controllers\Controller;
use App\Models\ItemPricings;
use App\Models\PricingSet;
use App\Models\PurchaseOptions;
use App\Models\SqlErrors;
use App\Models\TransactionHistory;
use App\Models\TransactionItems;
use App\Models\Transactions;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Events\TransactionUpdated;

class TransactionController extends Controller
{
    /**
     * Get all transactions with relationships
     */
    public function index(): JsonResponse
    {
        try {
            $statusCodes = array_keys(config('mappings.proc_status'));

            $transactions = Transactions::with(['company', 'client', 'user', 'latestHistory', 'histories.user'])
                ->get()
                ->sortBy(function ($txn) {
                    return $txn->latestHistory?->dtOccur ?? '';
                })
                ->values()
                ->map(function ($txn) use ($statusCodes) {
                    $latest = $txn->latestHistory;

                    $createdHistory = $txn->histories
                        ->where('nStatus', $statusCodes[0])
                        ->sortByDesc('nTransactionHistoryId')
                        ->first();

                    $createdBy = $createdHistory?->user
                        ? $createdHistory->user->strFName . ' ' . $createdHistory->user->strLName
                        : null;

                    return [
                        'nTransactionId'         => $txn->nTransactionId,
                        'strCode'                => $txn->strCode,
                        'cItemType'              => $txn->cItemType,
                        'cProcMode'              => $txn->cProcMode,
                        'cProcSource'            => $txn->cProcSource,
                        'nAssignedAO'            => $txn->nAssignedAO,
                        'dTotalABC'              => $txn->dTotalABC,
                        'dtPreBid'               => $txn->dtPreBid,
                        'strPreBid_Venue'        => $txn->strPreBid_Venue,
                        'dtDocIssuance'          => $txn->dtDocIssuance,
                        'strDocIssuance_Venue'   => $txn->strDocIssuance_Venue,
                        'dtDocSubmission'        => $txn->dtDocSubmission,
                        'strDocSubmission_Venue' => $txn->strDocSubmission_Venue,
                        'dtDocOpening'           => $txn->dtDocOpening,
                        'dtAODueDate'            => $txn->dtAODueDate,
                        'strDocOpening_Venue'    => $txn->strDocOpening_Venue,
                        'strTitle'               => $txn->strTitle,
                        'strRefNumber'           => $txn->strRefNumber,
                        'nDeliveryDays'          => $txn->nDeliveryDays,
                        'strDeliveryPlace'       => $txn->strDeliveryPlace,
                        'company'                => $txn->company,
                        'client'                 => $txn->client,
                        'user'                   => $txn->user,
                        'current_status'         => $latest?->nStatus ?? null,
                        'latest_history'         => $latest,
                        'created_by'             => $createdBy,
                    ];
                });

            return response()->json([
                'message'      => __('messages.retrieve_success', ['name' => 'Transactions']),
                'transactions' => $transactions,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Transactions');
        }
    }

    /**
     * Get transactions for procurement users
     */
    public function indexProcurement(Request $request): JsonResponse
    {
        try {
            $userId      = (int) $request->query('nUserId');
            $statusCodes = array_keys(config('mappings.proc_status'));

            $transactions = Transactions::with(['company', 'client', 'user', 'latestHistory', 'histories.user'])
                ->where(function ($query) use ($userId, $statusCodes) {
                    $query->whereHas('latestHistory', function ($q) use ($userId, $statusCodes) {
                        $q->where('nStatus', $statusCodes[0])->where('nUserId', $userId);
                    })
                        ->orWhereHas('latestHistory', function ($q) use ($statusCodes) {
                            $q->where('nStatus', $statusCodes[1]);
                        })
                        ->orWhereHas('latestHistory', function ($q) use ($statusCodes) {
                            $q->where('nStatus', $statusCodes[4]);
                        })
                        ->orWhere(function ($q) use ($userId, $statusCodes) {
                            $q->whereHas('latestHistory', function ($q2) use ($statusCodes) {
                                $q2->where('nStatus', $statusCodes[6]);
                            });

                            $q->whereHas('histories', function ($h) use ($userId, $statusCodes) {
                                $h->where('nStatus', $statusCodes[0])
                                    ->orderBy('nTransactionHistoryId', 'DESC')
                                    ->limit(1)
                                    ->where('nUserId', $userId);
                            });
                        })

                        ->orWhere(function ($q) use ($userId, $statusCodes) {
                            $q->whereHas('latestHistory', function ($q2) use ($statusCodes) {
                                $q2->where('nStatus', $statusCodes[3]);
                            });
                            $q->whereHas('histories', function ($h) use ($userId, $statusCodes) {
                                $h->where('nStatus', $statusCodes[0])
                                    ->orderBy('nTransactionHistoryId', 'DESC')
                                    ->limit(1)
                                    ->where('nUserId', $userId);
                            });
                        });
                })
                ->get()
                ->unique('nTransactionId')
                ->sortBy(function ($txn) {
                    return $txn->latestHistory?->dtOccur ?? '';
                })
                ->values()
                ->map(function ($txn) use ($userId, $statusCodes) {
                    $latest = $txn->latestHistory;

                    if ($latest && $latest->nUserId !== $userId) {
                        if ($latest->nStatus == $statusCodes[1]) {
                            $latest->nStatus = $statusCodes[2];
                        } elseif ($latest->nStatus == $statusCodes[4]) {
                            $latest->nStatus = $statusCodes[5];
                        }
                    }

                    $createdHistory = $txn->histories
                        ->where('nStatus', $statusCodes[0])
                        ->sortByDesc('nTransactionHistoryId')
                        ->first();

                    $createdBy = $createdHistory?->user
                        ? $createdHistory->user->strFName . ' ' . $createdHistory->user->strLName
                        : null;

                    return [
                        'nTransactionId'         => $txn->nTransactionId,
                        'strCode'                => $txn->strCode,
                        'strTitle'               => $txn->strTitle,
                        'cItemType'              => $txn->cItemType,
                        'cProcMode'              => $txn->cProcMode,
                        'cProcSource'            => $txn->cProcSource,
                        'dTotalABC'              => $txn->dTotalABC,
                        'strRefNumber'           => $txn->strRefNumber,
                        'dtPreBid'               => $txn->dtPreBid,
                        'strPreBid_Venue'        => $txn->strPreBid_Venue,
                        'dtDocIssuance'          => $txn->dtDocIssuance,
                        'strDocIssuance_Venue'   => $txn->strDocIssuance_Venue,
                        'dtDocSubmission'        => $txn->dtDocSubmission,
                        'strDocSubmission_Venue' => $txn->strDocSubmission_Venue,
                        'dtDocOpening'           => $txn->dtDocOpening,
                        'strDocOpening_Venue'    => $txn->strDocOpening_Venue,
                        'nDeliveryDays'          => $txn->nDeliveryDays,
                        'strDeliveryPlace'       => $txn->strDeliveryPlace,
                        'company'                => $txn->company,
                        'client'                 => $txn->client,
                        'user'                   => $txn->user,
                        'current_status'         => $latest?->nStatus ?? null,
                        'latest_history'         => $latest,
                        'created_by'             => $createdBy,
                    ];
                });

            return response()->json([
                'message'      => __('messages.retrieve_success', ['name' => 'Transaction']),
                'transactions' => $transactions,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Transaction');
        }
    }

    /**
     * Get transactions for account officers
     */
    public function indexAccountOfficer(Request $request): JsonResponse
    {
        try {
            $userId   = (int) $request->query('nUserId');
            $isAOTL   = (bool) $request->query('isAOTL', false);
            $fetchAll = (bool) $request->query('fetchAll', false);

            if (!$fetchAll && !$userId) {
                return response()->json([
                    'message' => __('messages.not_found', ['name' => 'User Id']),
                ], 400);
            }

            $aoStatusCodes   = array_keys(config('mappings.ao_status'));
            $aotlStatusCodes = array_keys(config('mappings.aotl_status'));

            $allowedStatuses = [
                $aotlStatusCodes[0],
                $aotlStatusCodes[1],
                $aotlStatusCodes[2],
                $aotlStatusCodes[3],
                $aotlStatusCodes[4],
                $aotlStatusCodes[5],
                $aotlStatusCodes[6],
            ];

            $transactions = Transactions::with(['company', 'client', 'user', 'latestHistory'])
                ->whereHas('latestHistory', function ($query) use ($userId, $isAOTL, $fetchAll, $aotlStatusCodes, $allowedStatuses) {
                    $query->whereIn('nStatus', $allowedStatuses)
                        ->where(function ($q) use ($userId, $isAOTL, $fetchAll, $aotlStatusCodes) {
                            if ($fetchAll && $isAOTL) {
                                // TL fetching all: no user filtering
                            } elseif ($isAOTL) {
                                $q->where(function ($q2) use ($userId, $aotlStatusCodes) {
                                    $q2->whereIn('nStatus', [$aotlStatusCodes[1], $aotlStatusCodes[4]])
                                        ->whereHas('transaction', fn($qq) => $qq->where('nAssignedAO', $userId));
                                })->orWhere(function ($q2) use ($aotlStatusCodes) {
                                    $q2->whereIn('nStatus', [
                                        $aotlStatusCodes[0],
                                        $aotlStatusCodes[2],
                                        $aotlStatusCodes[3],
                                        $aotlStatusCodes[5],
                                        $aotlStatusCodes[6],
                                    ]);
                                });
                            } else {
                                $q->where(function ($q2) use ($userId, $aotlStatusCodes) {
                                    $q2->whereIn('nStatus', [$aotlStatusCodes[1], $aotlStatusCodes[4]])
                                        ->whereHas('transaction', fn($qq) => $qq->where('nAssignedAO', $userId));
                                })->orWhere(function ($q2) use ($aotlStatusCodes) {
                                    $q2->whereIn('nStatus', [
                                        $aotlStatusCodes[0],
                                        $aotlStatusCodes[2],
                                        $aotlStatusCodes[3],
                                        $aotlStatusCodes[5],
                                        $aotlStatusCodes[6],
                                    ]);
                                });
                            }
                        });
                })
                ->get()
                ->sortBy(function ($txn) {
                    return $txn->latestHistory?->dtOccur ?? '';
                })
                ->values()
                ->map(function ($txn) use ($userId, $aoStatusCodes) {
                    $latest = $txn->latestHistory;

                    if ($latest) {
                        $isAssignedAO = $txn->nAssignedAO == $userId;
                        if (!$isAssignedAO) {
                            if ($latest->nStatus == $aoStatusCodes[1]) $latest->nStatus = $aoStatusCodes[2];
                            if ($latest->nStatus == $aoStatusCodes[4]) $latest->nStatus = $aoStatusCodes[5];
                        }
                    }

                    return [
                        'nTransactionId'         => $txn->nTransactionId,
                        'strCode'                => $txn->strCode,
                        'cItemType'              => $txn->cItemType,
                        'cProcMode'              => $txn->cProcMode,
                        'cProcSource'            => $txn->cProcSource,
                        'dTotalABC'              => $txn->dTotalABC,
                        'dtPreBid'               => $txn->dtPreBid,
                        'strPreBid_Venue'        => $txn->strPreBid_Venue,
                        'dtDocIssuance'          => $txn->dtDocIssuance,
                        'strDocIssuance_Venue'   => $txn->strDocIssuance_Venue,
                        'dtDocSubmission'        => $txn->dtDocSubmission,
                        'strDocSubmission_Venue' => $txn->strDocSubmission_Venue,
                        'dtDocOpening'           => $txn->dtDocOpening,
                        'strDocOpening_Venue'    => $txn->strDocOpening_Venue,
                        'dtAODueDate'            => $txn->dtAODueDate,
                        'strTitle'               => $txn->strTitle,
                        'nDeliveryDays'          => $txn->nDeliveryDays,
                        'strDeliveryPlace'       => $txn->strDeliveryPlace,
                        'nAssignedAO'            => $txn->nAssignedAO,
                        'company'                => $txn->company,
                        'client'                 => $txn->client,
                        'user'                   => $txn->user,
                        'current_status'         => $latest?->nStatus ?? null,
                        'latest_history'         => $latest,
                    ];
                });

            return response()->json([
                'message'      => __('messages.retrieve_success', ['name' => 'Transactions']),
                'transactions' => $transactions,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Transactions');
        }
    }

    /**
     * Create a new transaction
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nCompanyId'             => 'required|integer',
                'nClientId'              => 'required|integer',
                'strTitle'               => 'required|string|max:500',
                'strRefNumber'           => 'nullable|string|max:255',
                'dTotalABC'              => 'nullable|numeric',
                'cProcMode'              => 'nullable|string|max:20',
                'cItemType'              => 'nullable|string|max:1',
                'strCode'                => 'nullable|string|max:30',
                'cProcSource'            => 'nullable|string|max:1',
                'dtPreBid'               => 'nullable|date',
                'strPreBid_Venue'        => 'nullable|string|max:70',
                'dtDocIssuance'          => 'nullable|date',
                'strDocIssuance_Venue'   => 'nullable|string|max:70',
                'dtDocSubmission'        => 'nullable|date',
                'strDocSubmission_Venue' => 'nullable|string|max:70',
                'dtDocOpening'           => 'nullable|date',
                'strDocOpening_Venue'    => 'nullable|string|max:70',
                'nUserId'                => 'required',
                'nDeliveryDays'          => 'nullable|integer',
                'strDeliveryPlace'       => 'nullable|string|max:70',
            ]);

            $transaction = Transactions::create($validated);

            TransactionHistory::create([
                'nTransactionId' => $transaction->nTransactionId,
                'dtOccur'        => TimeHelper::now(),
                'nStatus'        => '100',
                'nUserId'        => $validated['nUserId'],
                'strRemarks'     => null,
            ]);
            broadcast(new TransactionUpdated('created', $transaction->nTransactionId))->toOthers();
            return response()->json([
                'message'     => __('messages.store_success', ['name' => 'Transaction']),
                'transaction' => $transaction,
            ], 201);
        } catch (Exception $e) {
            return $this->handleException($e, 'store_failed', 'Transaction');
        }
    }

    /**
     * Update an existing transaction
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nCompanyId'             => 'required|integer',
                'nClientId'              => 'required|integer',
                'strTitle'               => 'required|string|max:500',
                'strRefNumber'           => 'nullable|string|max:255',
                'dTotalABC'              => 'nullable|numeric',
                'cProcMode'              => 'nullable|string|max:20',
                'cItemType'              => 'nullable|string|max:1',
                'strCode'                => 'nullable|string|max:30',
                'cProcSource'            => 'nullable|string|max:1',
                'dtPreBid'               => 'nullable|date',
                'strPreBid_Venue'        => 'nullable|string|max:70',
                'dtDocIssuance'          => 'nullable|date',
                'strDocIssuance_Venue'   => 'nullable|string|max:70',
                'dtDocSubmission'        => 'nullable|date',
                'strDocSubmission_Venue' => 'nullable|string|max:70',
                'dtDocOpening'           => 'nullable|date',
                'strDocOpening_Venue'    => 'nullable|string|max:70',
                'nDeliveryDays'          => 'nullable|integer',
                'strDeliveryPlace'       => 'nullable|string|max:70',
            ]);

            $transaction = Transactions::findOrFail($id);
            $transaction->update($validated);
            broadcast(new TransactionUpdated('updated', $transaction->nTransactionId))->toOthers();
            return response()->json([
                'message'     => __('messages.update_success', ['name' => 'Transaction']),
                'transaction' => $transaction,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Transaction');
        }
    }

    /**
     * Show a specific transaction (not implemented)
     */
    public function show(): void {}

    /**
     * Delete a transaction
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $transaction = Transactions::findOrFail($id);

            $hasItems = TransactionItems::where('nTransactionId', $transaction->nTransactionId)->exists();
            $hasPricingSets = PricingSet::where('nTransactionId', $transaction->nTransactionId)->exists();

            $hasItemPricings = ItemPricings::whereHas('transactionItem', fn($q) => $q->where('nTransactionId', $transaction->nTransactionId))
                ->orWhereHas('pricingSet', fn($q) => $q->where('nTransactionId', $transaction->nTransactionId))
                ->exists();

            $hasPurchaseOptions = PurchaseOptions::whereHas('transactionItem', fn($q) => $q->where('nTransactionId', $transaction->nTransactionId))
                ->exists();

            if ($hasItems || $hasPricingSets || $hasItemPricings || $hasPurchaseOptions) {
                return response()->json([
                    'message' => __('messages.delete_blocked', ['name' => 'Transaction']),
                    'warning' => 'Cannot delete this transaction because it still has linked items, pricing sets, or purchase options.',
                ], 409);
            }

            $transaction->delete();
            broadcast(new TransactionUpdated('deleted', $id))->toOthers();
            return response()->json([
                'message'       => __('messages.delete_success', ['name' => 'Transaction']),
                'transactionId' => $id,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => __('messages.not_found', ['name' => 'Transaction']),
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'delete_failed', 'Transaction');
        }
    }

    /**
     * Revert transaction to previous status
     */
    public function revert(Request $request, int $id): JsonResponse
    {
        try {
            $transaction    = Transactions::findOrFail($id);
            $latestHistory  = $transaction->histories()->latest('dtOccur')->first();

            if (!$latestHistory) {
                return response()->json([
                    'message' => __('messages.not_found', ['name' => 'Transaction']),
                ], 404);
            }

            $currentStatus = $latestHistory->nStatus;
            $statusFlow    = config('mappings.status_transaction');
            $codes         = array_keys($statusFlow);
            $currentIndex  = array_search($currentStatus, $codes);

            if ($currentIndex === false || $currentIndex === 0) {
                return response()->json([
                    'message' => __('messages.revert_blocked'),
                ], 400);
            }

            $previousStatus  = $codes[$currentIndex - 1];
            $previousHistory = $transaction->histories()
                ->where('nStatus', $previousStatus)
                ->latest('dtOccur')
                ->first();

            $previousUserId = $previousHistory?->nUserId;

            TransactionHistory::create([
                'nTransactionId' => $id,
                'nUserId' => $previousUserId ?? Auth::id(),
                // 'nUserId' => $previousUserId ?? auth()->id(),
                'nStatus'        => $previousStatus,
                'strRemarks'     => $request->input('remarks'),
                'dtOccur'        => TimeHelper::now(),
            ]);

            if ((int) $previousStatus === 200) {
                $transaction->nAssignedAO  = null;
                $transaction->dtAODueDate  = null;
            }
            $transaction->save();
            broadcast(new TransactionUpdated('reverted', $id))->toOthers();
            return response()->json([
                'message'               => __('messages.update_success', ['name' => 'Transaction Reverted']),
                'transaction'           => $transaction,
                'previous_status'       => $previousStatus,
                'previous_status_label' => $statusFlow[$previousStatus] ?? $previousStatus,
                'previous_user_id'      => $previousUserId,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found.',
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Revert Transaction');
        }
    }
    /**
     * Get transaction history
     */
    public function getHistory(int $id): JsonResponse
    {
        try {
            $history = TransactionHistory::where('nTransactionId', $id)
                ->with('user')
                ->orderBy('dtOccur', 'desc')
                ->get()
                ->map(fn($item) => [
                    'dtOccur'    => $item->dtOccur,
                    'nStatus'    => $item->nStatus,
                    'nUserId'    => $item->user
                        ? $item->user->strFName . ' ' . $item->user->strLName
                        : 'System',
                    'strRemarks' => $item->strRemarks,
                ]);

            return response()->json([
                'message' => __('messages.retrieve_success', ['name' => 'Transaction History']),
                'history' => $history,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => __('messages.retrieve_failed', ['name' => 'Transaction History']),
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Get pricing modal data
     */
    public function getPricingModalData(int $id): JsonResponse
    {
        try {
            $transaction = Transactions::with([
                'transactionItems.itemPricings.pricingSet',
                'transactionItems.purchaseOptions',
            ])->findOrFail($id);

            $transactionTotalABC = $transaction->dTotalABC ?? 0;
            $itemsWithABC        = $transaction->transactionItems->filter(fn($i) => $i->dUnitABC !== null);
            $itemsWithoutABC     = $transaction->transactionItems->filter(fn($i) => $i->dUnitABC === null);
            $sumSetABC           = $itemsWithABC->sum('dUnitABC');
            $remainingABC        = max($transactionTotalABC - $sumSetABC, 0);
            $countUnset          = $itemsWithoutABC->count();
            $abcPerUnset         = $countUnset ? $remainingABC / $countUnset : 0;

            $pricingData = [
                'transactionName' => $transaction->strTitle,
                'transactionId'   => $transaction->strCode,
                'totalABC'        => $transactionTotalABC,
                'items'           => $transaction->transactionItems->map(function ($item) use ($abcPerUnset) {
                    $firstPricing  = $item->itemPricings->first();
                    $purchasePrice = $item->purchaseOptions
                        ->where('bIncluded', 1)
                        ->sortBy('dUnitPrice')
                        ->first()?->dUnitPrice ?? 0;

                    return [
                        'id'            => $item->nTransactionItemId,
                        'name'          => $item->strName,
                        'qty'           => $item->nQuantity,
                        'purchasePrice' => $purchasePrice,
                        'sellingPrice'  => $firstPricing?->dUnitSellingPrice ?? 0,
                        'abc'           => $item->dUnitABC ?? $abcPerUnset,
                        'pricingSet'    => $firstPricing?->pricingSet?->strName ?? null,
                        'purchaseOptions' => $item->purchaseOptions->map(fn($option) => [
                            'id'         => $option->nPurchaseOptionId,
                            'supplierId' => $option->nSupplierId,
                            'qty'        => $option->nQuantity,
                            'unitPrice'  => $option->dUnitPrice,
                            'uom'        => $option->strUOM,
                            'brand'      => $option->strBrand,
                            'model'      => $option->strModel,
                            'included'   => (bool) $option->bIncluded,
                        ]),
                    ];
                }),
            ];

            return response()->json([
                'message'     => __('messages.retrieve_success', ['name' => 'Pricing data']),
                'transaction' => $pricingData,
            ]);
        } catch (Exception $e) {
            return $this->handleException($e, 'retrieve_failed', 'Pricing data');
        }
    }

    /**
     * Assign Account Officer to transaction
     */
    public function assignAO(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nAssignedAO' => 'required|integer|exists:tblusers,nUserId',
                'dtAODueDate' => 'nullable|date',
                'user_id'     => 'required|integer|exists:tblusers,nUserId',
                'remarks'     => 'nullable|string|max:255',
            ]);

            $transaction = Transactions::findOrFail($id);

            $isReassign = !is_null($transaction->nAssignedAO);

            // Fetch the assigned AO's full name
            $assignedUser = User::find($validated['nAssignedAO']);
            $assignedFullName = $assignedUser
                ? $assignedUser->strFName . ' ' . $assignedUser->strLName
                : 'Unknown';

            $action   = $isReassign ? 'Reassigned' : 'Assigned';
            $remarks  = $validated['remarks'] ?? "{$action} Transaction to {$assignedFullName}";

            $transaction->update([
                'nAssignedAO' => $validated['nAssignedAO'],
                'dtAODueDate' => $validated['dtAODueDate'] ?? null,
            ]);

            TransactionHistory::create([
                'nTransactionId' => $transaction->nTransactionId,
                'dtOccur'        => TimeHelper::now(),
                'nStatus'        => 210,
                'nUserId'        => $validated['user_id'],
                'strRemarks'     => $remarks,
            ]);
            broadcast(new TransactionUpdated('assigned', $id))->toOthers();
            return response()->json([
                'message'     => __('messages.update_success', ['name' => "{$action} Account Officer"]),
                'transaction' => $transaction,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', 'Assign AO');
        }
    }
    /**
     * Finalize transaction (Procurement)/
     */
    public function finalizetransaction(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '110', 'Transaction Finalized', $request->input('remarks'));
    }
    /**
     * Verify transaction (Procurement)
     */
    public function verifytransaction(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '200', 'Transaction Verified', $request->input('remarks'));
    }
    /**
     * Finalize transaction (Account Officer)
     */
    public function finalizetransactionAO(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '220', 'Transaction Finalized (AO)', $request->input('remarks'));
    }
    /**
     * Verify transaction (Account Officer)
     */
    public function verifytransactionAO(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '230', 'Transaction Verified (AO)', $request->input('remarks'));
    }
    /**
     * Finalize transaction pricing (Procurement)
     */
    public function finalizeTransactionPricing(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '310', 'Transaction Pricing Finalized', $request->input('remarks'));
    }
    /**
     * Verify transaction pricing (Procurement)
     */
    public function verifyTransactionPricing(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '320', 'Transaction Pricing Verified', $request->input('remarks'));
    }
    /**
     * Finalize transaction canvas (Account Officer)
     */
    public function finalizetransactionAOC(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '240', 'Transaction Finalized (AO)', $request->input('remarks'));
    }
    /**
     * Verify transaction canvas (Account Officer)
     */
    public function verifytransactionAOC(Request $request, int $id): JsonResponse
    {
        return $this->changeTransactionStatus($id, $request->input('userId'), '300', 'Transaction Verified (AO)', $request->input('remarks'));
    }
    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------
    private function changeTransactionStatus(int $id, ?int $userId, string $newStatus, string $actionName, ?string $remarks = null): JsonResponse
    {
        try {
            if (!$userId) {
                return response()->json([
                    'message' => __('messages.not_found', ['name' => 'User Id']),
                ], 400);
            }

            $transaction = Transactions::findOrFail($id);

            TransactionHistory::create([
                'nTransactionId' => $id,
                'nUserId'        => $userId,
                'nStatus'        => $newStatus,
                'strRemarks'     => $remarks,
                'dtOccur'        => TimeHelper::now(),
            ]);

            Log::info("Transaction status changed", [
                'transaction_id' => $id,
                'user_id'        => $userId,
                'new_status'     => $newStatus,
            ]);
            broadcast(new TransactionUpdated('status_changed', $id, [
                'new_status' => $newStatus
            ]))->toOthers();
            return response()->json([
                'message'     => __('messages.update_success', ['name' => $actionName]),
                'transaction' => $transaction,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found.',
                'error'   => $e->getMessage(),
            ], 404);
        } catch (Exception $e) {
            return $this->handleException($e, 'update_failed', $actionName);
        }
    }

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
