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
        $query = JournalAccount::with('parent')->orderBy('strAccountName');

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
        ]);

        $journalAccount = JournalAccount::create([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
        ]);

        broadcast(new JournalAccountUpdated('created', $journalAccount->nJournalAccountId))->toOthers();

        return response()->json($journalAccount->load('parent'), 201);
    }

    /**
     * PUT/PATCH /journal-accounts/{journalAccount}
     */
    public function update(Request $request, JournalAccount $journalAccount)
    {
        $request->validate([
            'strAccountName'   => 'required|string|max:50',
            'nParentAccountId' => 'nullable|integer|exists:tbljournalaccounts,nJournalAccountId',
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
        ]);
        broadcast(new JournalAccountUpdated('updated', $journalAccount->nJournalAccountId))->toOthers();
        return response()->json($journalAccount->load('parent'));
    }
    /**
     * GET /journal-accounts/{journalAccount}
     */
    public function show(JournalAccount $journalAccount)
    {
        return response()->json($journalAccount);
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
        $existingNames = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->pluck('strAccountName')
            ->map(fn($n) => trim($n))
            ->toArray();

        $statusCodes = array_keys(config('mappings.status_client'));

        $clients = \App\Models\Client::where('cStatus', $statusCodes[0])
            ->orderBy('strClientName')
            ->get();

        $available = $clients->filter(function ($client) use ($existingNames) {
            $nickname = $client->strClientNickName ?: $client->strClientName;
          return !in_array("Receivables from {$nickname}", $existingNames, true);
        })->values();

        return response()->json($available);
    }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-clients
     * Bulk-creates child journal accounts, one per selected active client, named
     * "Collectibles from {strClientNickName}".
     */
    public function flashImportClients(Request $request, JournalAccount $journalAccount)
    {
        $request->validate([
            'clientIds'   => 'required|array|min:1',
            'clientIds.*' => 'integer|exists:tblclients,nClientId',
        ]);

        $statusCodes = array_keys(config('mappings.status_client'));

        $clients = Client::whereIn('nClientId', $request->clientIds)
            ->where('cStatus', $statusCodes[0])
            ->get();

        $existingNames = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->pluck('strAccountName')
            ->toArray();

        $created = [];

        foreach ($clients as $client) {
            $nickname = $client->strClientNickName ?: $client->strClientName;
            $accountName = "Receivables from {$nickname}";

            if (in_array($accountName, $existingNames, true)) {
                continue; // already imported, skip defensively
            }

            $created[] = JournalAccount::create([
                'strAccountName'   => $accountName,
                'nParentAccountId' => $journalAccount->nJournalAccountId,
            ]);

            $existingNames[] = $accountName;
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
        $existingNames = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->pluck('strAccountName')
            ->map(fn($n) => trim($n))
            ->toArray();

        $statusCodes = array_keys(config('mappings.status_user'));

        $suppliers = Supplier::where('cStatus', $statusCodes[0])
            ->orderBy('strSupplierName')
            ->get();

        $available = $suppliers->filter(function ($supplier) use ($existingNames) {
            $nickname = $supplier->strSupplierNickName ?: $supplier->strSupplierName;
            return !in_array("Receivables from {$nickname}", $existingNames, true);
        })->values();

        return response()->json($available);
    }

    /**
     * POST /journal-accounts/{journalAccount}/flash-import-suppliers
     * Bulk-creates child journal accounts, one per selected supplier, named
     * "Receivables from {strSupplierNickName}".
     */
    public function flashImportSuppliers(Request $request, JournalAccount $journalAccount)
    {
        $request->validate([
            'supplierIds'   => 'required|array|min:1',
            'supplierIds.*' => 'integer|exists:tblsuppliers,nSupplierId',
        ]);

        $suppliers = Supplier::whereIn('nSupplierId', $request->supplierIds)->get();

        $existingNames = JournalAccount::where('nParentAccountId', $journalAccount->nJournalAccountId)
            ->pluck('strAccountName')
            ->toArray();

        $created = [];

        foreach ($suppliers as $supplier) {
            $nickname = $supplier->strSupplierNickName ?: $supplier->strSupplierName;
            $accountName = "Receivables from {$nickname}";

            if (in_array($accountName, $existingNames, true)) {
                continue; // already imported, skip defensively
            }

            $created[] = JournalAccount::create([
                'strAccountName'   => $accountName,
                'nParentAccountId' => $journalAccount->nJournalAccountId,
            ]);

            $existingNames[] = $accountName;
        }

        return response()->json([
            'message' => count($created) . ' journal account(s) imported successfully.',
            'created' => $created,
        ], 201);
    }
}
