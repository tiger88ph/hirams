<?php

namespace App\Http\Controllers\Api;

use App\Events\ClientUpdated;
use App\Events\JournalAccountUpdated;
use App\Events\SupplierUpdated;
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

        $accounts = $query->get();

        $this->tagLinkedEntityStatus($accounts);

        return response()->json($accounts);
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
     * For "Receivables from {nickname}" accounts under the top-level
     * "Collection" or "Purchases" accounts, append "(pending)" / "(inactive)"
     * to strAccountName in the response when the linked client/supplier's
     * cStatus is 'P' or 'I'. Display-only — never persisted.
     */
    private function tagLinkedEntityStatus($accounts): void
    {
        $prefix = 'Receivables from ';

        $parentIds = $accounts->pluck('nParentAccountId')->filter()->unique()->values();
        $parents = JournalAccount::whereIn('nJournalAccountId', $parentIds)
            ->whereNull('nParentAccountId')
            ->pluck('strAccountName', 'nJournalAccountId');

        $statusTags = ['P' => 'pending', 'I' => 'inactive'];

        $clientMap = [];
        foreach (Client::all() as $client) {
            $nickname = $client->strClientNickName ?: $client->strClientName;
            $clientMap[$nickname] = $client->cStatus;
        }

        $supplierMap = [];
        foreach (Supplier::all() as $supplier) {
            $nickname = $supplier->strSupplierNickName ?: $supplier->strSupplierName;
            $supplierMap[$nickname] = $supplier->cStatus;
        }

        foreach ($accounts as $account) {
            if (!str_starts_with($account->strAccountName, $prefix)) {
                continue;
            }

            $parentName = $parents[$account->nParentAccountId] ?? null;
            $nickname = trim(substr($account->strAccountName, strlen($prefix)));

            $status = null;
            if ($parentName === 'Collection' && isset($clientMap[$nickname])) {
                $status = $clientMap[$nickname];
            } elseif ($parentName === 'Purchases' && isset($supplierMap[$nickname])) {
                $status = $supplierMap[$nickname];
            }

            if ($status !== null && isset($statusTags[$status])) {
                $account->strAccountName .= " ({$statusTags[$status]})";
            }
        }
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

        $oldAccountName = $journalAccount->strAccountName;
        $parentId       = $journalAccount->nParentAccountId;

        $journalAccount->update([
            'strAccountName'   => $request->strAccountName,
            'nParentAccountId' => $request->nParentAccountId,
        ]);

        $this->syncLinkedEntityNickname($oldAccountName, $request->strAccountName, $parentId);

        broadcast(new JournalAccountUpdated('updated', $journalAccount->nJournalAccountId))->toOthers();
        return response()->json($journalAccount->load('parent'));
    }

    /**
     * If a journal account named "Receivables from {nickname}" is renamed,
     * push the new nickname back onto the matching Client/Supplier — the
     * mirror image of what happens on Client::update() / Supplier::update().
     */
    private function syncLinkedEntityNickname(string $oldAccountName, string $newAccountName, ?int $parentId): void
    {
        if (!$parentId || $oldAccountName === $newAccountName) {
            return;
        }

        $prefix = 'Receivables from ';

        if (!str_starts_with($oldAccountName, $prefix) || !str_starts_with($newAccountName, $prefix)) {
            return;
        }

        $oldNickname = trim(substr($oldAccountName, strlen($prefix)));
        $newNickname = trim(substr($newAccountName, strlen($prefix)));

        if ($oldNickname === '' || $newNickname === '') {
            return;
        }

        $parentAccount = JournalAccount::find($parentId);
        if (!$parentAccount || $parentAccount->nParentAccountId !== null) {
            return; // only act when the parent is itself a top-level account
        }

        if ($parentAccount->strAccountName === 'Collection') {
            $client = Client::where(function ($q) use ($oldNickname) {
                $q->where('strClientNickName', $oldNickname)
                    ->orWhere(function ($q2) use ($oldNickname) {
                        $q2->whereNull('strClientNickName')
                            ->orWhere('strClientNickName', '')
                            ->where('strClientName', $oldNickname);
                    });
            })->first();

            if ($client) {
                if ($client->strClientNickName) {
                    $client->strClientNickName = $newNickname;
                } else {
                    $client->strClientName = $newNickname;
                }
                $client->save();
                broadcast(new ClientUpdated('updated', $client->nClientId))->toOthers();
            }
        } elseif ($parentAccount->strAccountName === 'Purchases') {
            $supplier = Supplier::where(function ($q) use ($oldNickname) {
                $q->where('strSupplierNickName', $oldNickname)
                    ->orWhere(function ($q2) use ($oldNickname) {
                        $q2->whereNull('strSupplierNickName')
                            ->orWhere('strSupplierNickName', '')
                            ->where('strSupplierName', $oldNickname);
                    });
            })->first();

            if ($supplier) {
                if ($supplier->strSupplierNickName) {
                    $supplier->strSupplierNickName = $newNickname;
                } else {
                    $supplier->strSupplierName = $newNickname;
                }
                $supplier->save();
                broadcast(new SupplierUpdated('updated', $supplier->nSupplierId))->toOthers();
            }
        }
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
