<?php

namespace App\Http\Controllers\Api;

use App\Events\JournalAccountUpdated;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\JevEntries;
use App\Models\JournalAccount;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JournalAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalAccount::with(['parent', 'client', 'supplier'])->orderBy('strAccountName');

        // Only return top-level accounts (no parent) — used for the first
        // level of account-chain selects.
        if ($request->boolean('onlyParents')) {
            $query->whereNull('nParentAccountId');
        }

        // When editing an account, exclude itself and all of its descendants
        // from the selectable parent list (prevents circular links).
        if ($request->filled('excludeDescendantsOf')) {
            $excludeId = (int) $request->excludeDescendantsOf;
            $excludeIds = $this->getDescendantIds($excludeId);
            $excludeIds[] = $excludeId;
            $query->whereNotIn('nJournalAccountId', $excludeIds);
        }

        if ($request->filled('nParentAccountId')) {
            $query->where('nParentAccountId', $request->nParentAccountId);
        }

        return response()->json($query->get());
    }
    /**
     * Recursively collect all descendant IDs of a given account.
     */
    private function getDescendantIds(int $id): array
    {
        $ids = [];
        $children = JournalAccount::where('nParentAccountId', $id)->pluck('nJournalAccountId');

        foreach ($children as $childId) {
            $ids[] = $childId;
            $ids = array_merge($ids, $this->getDescendantIds($childId));
        }

        return $ids;
    }

    /**
     * POST /journal-accounts
     */
    public function store(Request $request)
    {
        $request->validate([
            'strAccountName'   => 'required|string|max:50',
            'nParentAccountId' => 'nullable|integer|exists:tbljournalaccounts,nJournalAccountId',
            'cAccountType' => 'nullable|in:C,S,F,E',
        ]);

        // store
        if ($error = $this->checkRecordLink($request)) return $error;

        $journalAccount = JournalAccount::create([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
            'nRecordId'        => $this->resolveRecordId($request),
            'cAccountType'     => $request->cAccountType,
        ]);
        broadcast(new JournalAccountUpdated('created', $journalAccount->nJournalAccountId))->toOthers();

        return response()->json($journalAccount->load(['parent.client', 'parent.supplier', 'client', 'supplier']), 201);
    }
    /**
     * PUT/PATCH /journal-accounts/{journalAccount}
     */
    public function update(Request $request, JournalAccount $journalAccount)
    {
        $request->validate([
            'strAccountName'   => 'required|string|max:50',
            'nParentAccountId' => 'nullable|integer|exists:tbljournalaccounts,nJournalAccountId',
            'cAccountType' => 'nullable|in:C,P,F,E',
        ]);

        if ($request->filled('nParentAccountId')) {
            $newParentId = (int) $request->nParentAccountId;

            if ($newParentId === (int) $journalAccount->nJournalAccountId) {
                return response()->json(['message' => 'An account cannot be its own parent.'], 422);
            }

            $descendantIds = $this->getDescendantIds((int) $journalAccount->nJournalAccountId);
            if (in_array($newParentId, $descendantIds, true)) {
                return response()->json([
                    'message' => 'Cannot link to one of its own linked accounts — this would create a loop.',
                ], 422);
            }
        }

        // update (after the existing loop checks)
        if ($error = $this->checkRecordLink($request, (int) $journalAccount->nJournalAccountId)) return $error;

        $journalAccount->update([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
            'nRecordId'        => $this->resolveRecordId($request),
            'cAccountType'     => $request->cAccountType,
        ]);
        broadcast(new JournalAccountUpdated('updated', $journalAccount->nJournalAccountId))->toOthers();
        return response()->json($journalAccount->load(['parent.client', 'parent.supplier', 'client', 'supplier']));
    }
    /**
     * GET /journal-accounts/{journalAccount}
     */
    public function show(JournalAccount $journalAccount)
    {
        return response()->json($journalAccount->load(['parent.client', 'parent.supplier', 'client', 'supplier']));
    }

    /**
     * DELETE /journal-accounts/{journalAccount}
     */
    public function destroy(JournalAccount $journalAccount)
    {
        $id = $journalAccount->nJournalAccountId;

        if (JournalAccount::where('nParentAccountId', $id)->exists()) {
            return response()->json([
                'message' => 'Cannot delete an account that has linked accounts. Move or delete them first.',
            ], 422);
        }

        // An account that already carries journal (JEV) entries is part of the
        // books — deleting it would orphan those lines.
        if (JevEntries::where('nJournalAccountId', $id)->exists()) {
            return response()->json([
                'message' => 'Cannot delete an account that has journal entries. Remove or reassign its entries first.',
            ], 422);
        }

        $journalAccount->delete();
        broadcast(new JournalAccountUpdated('deleted', $id))->toOthers();
        return response()->json(['message' => 'Journal account deleted successfully.']);
    }
    /**
     * GET /journal-accounts/{journalAccount}/available-clients-for-import
     * Returns active clients that don't already have a "Collectibles from {nickname}"
     * child account under this journal account.
     */
    // public function availableClientsForImport(JournalAccount $journalAccount)
    // {
    //     $existingClientIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
    //         ->where('cAccountType', 'C')
    //         ->whereNotNull('nRecordId')
    //         ->pluck('nRecordId')
    //         ->toArray();
    //     $statusCodes = array_keys(config('mappings.status_client'));

    //     $clients = Client::where('cStatus', $statusCodes[0])
    //         ->whereNotIn('nClientId', $existingClientIds)
    //         ->orderBy('strClientName')
    //         ->get();

    //     return response()->json($clients);
    // }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-clients
     * Bulk-creates child journal accounts, one per selected active client, named
     * "Collectibles from {strClientNickName}".
     */
    // public function flashImportClients(Request $request, JournalAccount $journalAccount)
    // {
    //     if ($journalAccount->cAccountType !== 'C') {
    //         return response()->json(['message' => 'This account does not accept client imports.'], 422);
    //     }

    //     $request->validate([
    //         'clientIds'   => 'required|array|min:1',
    //         'clientIds.*' => 'integer|exists:tblclients,nClientId',
    //     ]);

    //     $statusCodes = array_keys(config('mappings.status_client'));

    //     $clients = Client::whereIn('nClientId', $request->clientIds)
    //         ->where('cStatus', $statusCodes[0])
    //         ->get();
    //     $existingClientIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
    //         ->where('cAccountType', 'C')
    //         ->whereNotNull('nRecordId')
    //         ->pluck('nRecordId')
    //         ->toArray();
    //     $created = [];

    //     foreach ($clients as $client) {
    //         if (in_array($client->nClientId, $existingClientIds, true)) {
    //             continue; // already imported, skip defensively
    //         }

    //         $created[] = JournalAccount::create([
    //             'strAccountName'   => null,
    //             'nParentAccountId' => $journalAccount->nJournalAccountId,
    //             'nRecordId'        => $client->nClientId,
    //             'cAccountType'     => 'C',
    //         ]);

    //         $existingClientIds[] = $client->nClientId;
    //     }

    //     return response()->json([
    //         'message' => count($created) . ' journal account(s) imported successfully.',
    //         'created' => $created,
    //     ], 201);
    // }
    /**
     * GET /journal-accounts/{journalAccount}/available-suppliers-for-import
     * Returns active suppliers that don't already have a "Purchases from {nickname}"
     * child account under this journal account.
     */
    // public function availableSuppliersForImport(JournalAccount $journalAccount)
    // {
    //     $existingSupplierIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
    //         ->where('cAccountType', 'S')
    //         ->whereNotNull('nRecordId')
    //         ->pluck('nRecordId')
    //         ->toArray();

    //     $statusCodes = array_keys(config('mappings.status_user'));

    //     $suppliers = Supplier::where('cStatus', $statusCodes[0])
    //         ->whereNotIn('nSupplierId', $existingSupplierIds)
    //         ->orderBy('strSupplierName')
    //         ->get();

    //     return response()->json($suppliers);
    // }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-suppliers
     * Bulk-creates child journal accounts, one per selected supplier, named
     * "Receivables from {strSupplierNickName}".
     */
    // public function flashImportSuppliers(Request $request, JournalAccount $journalAccount)
    // {
    //     if ($journalAccount->cAccountType !== 'S') {
    //         return response()->json(['message' => 'This account does not accept supplier imports.'], 422);
    //     }

    //     $request->validate([
    //         'supplierIds'   => 'required|array|min:1',
    //         'supplierIds.*' => 'integer|exists:tblsuppliers,nSupplierId',
    //     ]);

    //     $suppliers = Supplier::whereIn('nSupplierId', $request->supplierIds)->get();
    //     $existingSupplierIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
    //         ->where('cAccountType', 'S')
    //         ->whereNotNull('nRecordId')
    //         ->pluck('nRecordId')
    //         ->toArray();
    //     $created = [];

    //     foreach ($suppliers as $supplier) {
    //         if (in_array($supplier->nSupplierId, $existingSupplierIds, true)) {
    //             continue; // already imported, skip defensively
    //         }

    //         $created[] = JournalAccount::create([
    //             'strAccountName'   => null,
    //             'nParentAccountId' => $journalAccount->nJournalAccountId,
    //             'nRecordId'        => $supplier->nSupplierId,
    //             'cAccountType'     => 'S',
    //         ]);
    //         $existingSupplierIds[] = $supplier->nSupplierId;
    //     }
    //     return response()->json([
    //         'message' => count($created) . ' journal account(s) imported successfully.',
    //         'created' => $created,
    //     ], 201);
    // }
    /**
     * PATCH /journal-accounts/{journalAccount}/move
     * Links an account under a new parent. Nothing else is changed.
     */
    public function move(Request $request, JournalAccount $journalAccount)
    {
        $request->validate([
            'nParentAccountId' => 'required|integer|exists:tbljournalaccounts,nJournalAccountId',
        ]);

        $newParentId = (int) $request->nParentAccountId;
        $id = (int) $journalAccount->nJournalAccountId;

        if ($newParentId === $id) {
            return response()->json(['message' => 'An account cannot be its own parent.'], 422);
        }

        if (in_array($newParentId, $this->getDescendantIds($id), true)) {
            return response()->json([
                'message' => 'Cannot link to one of its own linked accounts — this would create a loop.',
            ], 422);
        }

        $journalAccount->update(['nParentAccountId' => $newParentId]);

        broadcast(new JournalAccountUpdated('updated', $id))->toOthers();

        return response()->json(
            $journalAccount->load(['parent.client', 'parent.supplier', 'client', 'supplier'])
        );
    }
    /**
     * GET /journal-accounts/unlinked-records?type=C|S&includeAccountId=
     * Clients (C) or suppliers (S) not yet linked to a journal account.
     * includeAccountId keeps that account's own current record in the list (edit mode).
     */
    public function unlinkedRecords(Request $request)
    {
        $v = $request->validate([
            'type'             => 'required|in:C,S',
            'includeAccountId' => 'nullable|integer',
        ]);

        $type      = $v['type'];
        $accountId = $v['includeAccountId'] ?? null;

        // records linked by OTHER accounts
        $linkedIds = JournalAccount::where('cAccountType', $type)
            ->whereNotNull('nRecordId')
            ->when($accountId, fn($q) => $q->where('nJournalAccountId', '!=', $accountId))
            ->pluck('nRecordId');

        // the record this account already uses (so it stays selectable even if inactive)
        $own = $accountId
            ? JournalAccount::where('nJournalAccountId', $accountId)
            ->where('cAccountType', $type)
            ->value('nRecordId')
            : null;

        if ($type === 'C') {
            $active = array_keys(config('mappings.status_client'))[0];

            $rows = Client::where(function ($q) use ($active, $own) {
                $q->where('cStatus', $active);
                if ($own) $q->orWhere('nClientId', $own);
            })
                ->whereNotIn('nClientId', $linkedIds)
                ->orderBy('strClientName')
                ->get()
                ->map(fn($c) => [
                    'nRecordId'   => $c->nClientId,
                    'strName'     => $c->strClientName,
                    'strNickName' => $c->strClientNickName,
                ]);
        } else {
            $active = array_keys(config('mappings.status_user'))[0];

            $rows = Supplier::where(function ($q) use ($active, $own) {
                $q->where('cStatus', $active);
                if ($own) $q->orWhere('nSupplierId', $own);
            })
                ->whereNotIn('nSupplierId', $linkedIds)
                ->orderBy('strSupplierName')
                ->get()
                ->map(fn($s) => [
                    'nRecordId'   => $s->nSupplierId,
                    'strName'     => $s->strSupplierName,
                    'strNickName' => $s->strSupplierNickName,
                ]);
        }

        return response()->json($rows->values());
    }

    /** nRecordId only means something for Client / Supplier accounts. */
    private function resolveRecordId(Request $request): ?int
    {
        return in_array($request->cAccountType, ['C', 'S'], true) && $request->filled('nRecordId')
            ? (int) $request->nRecordId
            : null;
    }

    /** Returns an error response when the chosen record is missing or already linked. */
    private function checkRecordLink(Request $request, ?int $ignoreAccountId = null): ?JsonResponse
    {
        $recordId = $this->resolveRecordId($request);
        if ($recordId === null) return null;

        $type   = $request->cAccountType;
        $exists = $type === 'C'
            ? Client::where('nClientId', $recordId)->exists()
            : Supplier::where('nSupplierId', $recordId)->exists();

        if (!$exists) {
            return response()->json(['message' => 'The selected record does not exist.'], 422);
        }

        $taken = JournalAccount::where('cAccountType', $type)
            ->where('nRecordId', $recordId)
            ->when($ignoreAccountId, fn($q) => $q->where('nJournalAccountId', '!=', $ignoreAccountId))
            ->exists();

        if ($taken) {
            return response()->json(['message' => 'That record is already linked to another account.'], 422);
        }

        return null;
    }
}
