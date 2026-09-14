<?php

namespace App\Http\Controllers\Api;

use App\Events\JournalAccountUpdated;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\JournalAccount;
use App\Models\Supplier;
use Illuminate\Http\Request;

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
            'cAccountType'     => 'nullable|in:C,P',
        ]);

        $journalAccount = JournalAccount::create([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
            'nClientId'        => null,
            'nSupplierId'      => null,
            'cAccountType'     => $request->nParentAccountId ? null : $request->cAccountType,
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
            'cAccountType'     => 'nullable|in:C,P',
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

        $journalAccount->update([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
            'cAccountType'     => $request->nParentAccountId ? null : $request->cAccountType,
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
        $journalAccount->delete();
        broadcast(new JournalAccountUpdated('deleted', $id))->toOthers();
        return response()->json(['message' => 'Journal account deleted successfully.']);
    }
    /**
     * GET /journal-accounts/{journalAccount}/available-clients-for-import
     * Returns active clients that don't already have a "Collectibles from {nickname}"
     * child account under this journal account.
     */
    public function availableClientsForImport(JournalAccount $journalAccount)
    {
        $existingClientIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->whereNotNull('nClientId')
            ->pluck('nClientId')
            ->toArray();

        $statusCodes = array_keys(config('mappings.status_client'));

        $clients = \App\Models\Client::where('cStatus', $statusCodes[0])
            ->whereNotIn('nClientId', $existingClientIds)
            ->orderBy('strClientName')
            ->get();

        return response()->json($clients);
    }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-clients
     * Bulk-creates child journal accounts, one per selected active client, named
     * "Collectibles from {strClientNickName}".
     */
    public function flashImportClients(Request $request, JournalAccount $journalAccount)
    {
        if ($journalAccount->cAccountType !== 'C') {
            return response()->json(['message' => 'This account does not accept client imports.'], 422);
        }

        $request->validate([
            'clientIds'   => 'required|array|min:1',
            'clientIds.*' => 'integer|exists:tblclients,nClientId',
        ]);

        $statusCodes = array_keys(config('mappings.status_client'));

        $clients = Client::whereIn('nClientId', $request->clientIds)
            ->where('cStatus', $statusCodes[0])
            ->get();
        $existingClientIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->whereNotNull('nClientId')
            ->pluck('nClientId')
            ->toArray();

        $created = [];

        foreach ($clients as $client) {
            if (in_array($client->nClientId, $existingClientIds, true)) {
                continue; // already imported, skip defensively
            }

            $created[] = JournalAccount::create([
                'strAccountName'   => null,
                'nParentAccountId' => $journalAccount->nJournalAccountId,
                'nClientId'        => $client->nClientId,
                'nSupplierId'      => null,
            ]);

            $existingClientIds[] = $client->nClientId;
        }

        return response()->json([
            'message' => count($created) . ' journal account(s) imported successfully.',
            'created' => $created,
        ], 201);
    }
    /**
     * GET /journal-accounts/{journalAccount}/available-suppliers-for-import
     * Returns active suppliers that don't already have a "Purchases from {nickname}"
     * child account under this journal account.
     */
    public function availableSuppliersForImport(JournalAccount $journalAccount)
    {
        $existingSupplierIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->whereNotNull('nSupplierId')
            ->pluck('nSupplierId')
            ->toArray();

        $statusCodes = array_keys(config('mappings.status_user'));

        $suppliers = Supplier::where('cStatus', $statusCodes[0])
            ->whereNotIn('nSupplierId', $existingSupplierIds)
            ->orderBy('strSupplierName')
            ->get();

        return response()->json($suppliers);
    }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-suppliers
     * Bulk-creates child journal accounts, one per selected supplier, named
     * "Receivables from {strSupplierNickName}".
     */
    public function flashImportSuppliers(Request $request, JournalAccount $journalAccount)
    {
        if ($journalAccount->cAccountType !== 'P') {
            return response()->json(['message' => 'This account does not accept supplier imports.'], 422);
        }

        $request->validate([
            'supplierIds'   => 'required|array|min:1',
            'supplierIds.*' => 'integer|exists:tblsuppliers,nSupplierId',
        ]);

        $suppliers = Supplier::whereIn('nSupplierId', $request->supplierIds)->get();
        $existingSupplierIds = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->whereNotNull('nSupplierId')
            ->pluck('nSupplierId')
            ->toArray();

        $created = [];

        foreach ($suppliers as $supplier) {
            if (in_array($supplier->nSupplierId, $existingSupplierIds, true)) {
                continue; // already imported, skip defensively
            }

            $created[] = JournalAccount::create([
                'strAccountName'   => null,
                'nParentAccountId' => $journalAccount->nJournalAccountId,
                'nClientId'        => null,
                'nSupplierId'      => $supplier->nSupplierId,
            ]);

            $existingSupplierIds[] = $supplier->nSupplierId;
        }
        return response()->json([
            'message' => count($created) . ' journal account(s) imported successfully.',
            'created' => $created,
        ], 201);
    }
}
