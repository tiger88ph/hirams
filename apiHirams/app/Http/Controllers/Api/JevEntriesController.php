<?php

namespace App\Http\Controllers\Api;

use App\Events\JournalEntryUpdated;
use App\Http\Controllers\Controller;
use App\Models\JevEntries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JevEntriesController extends Controller
{
    // List all Entries
    public function index()
    {
        $res = JevEntries::with(['jev', 'journal_account.client', 'journal_account.supplier'])->get();
        return response()->json($res);
    }

    // Get single Entry by ID
    public function show($id)
    {
        $res = JevEntries::with(['jev', 'journal_account.client', 'journal_account.supplier'])->find($id);
        if (!$res) return response()->json(['message' => 'Not Found'], 404);
        return response()->json($res);
    }

    // Get all Entries under a JEV
    public function getByJevId($jevId)
    {
        $res = JevEntries::where('nJEVId', $jevId)
            ->with([
                'jev',
                'journal_account' => fn($q) => $q->with(['client', 'supplier']),
                'journal_account.parent' => fn($q) => $q->with(['client', 'supplier']),
                'journal_account.parent.parent' => fn($q) => $q->with(['client', 'supplier']),
                'journal_account.parent.parent.parent' => fn($q) => $q->with(['client', 'supplier']),
            ])
            ->get();
        return response()->json($res);
    }

    // Create Entry
    public function store(Request $request)
    {
        $res = DB::transaction(function () use ($request) {
            $entry = JevEntries::create([
                'nJEVId'            => $request->nJEVId,
                'nJournalAccountId' => $request->nJournalAccountId,
                'dAmount'           => $request->dAmount,
            ]);

            return JevEntries::with(['jev', 'journal_account.client', 'journal_account.supplier'])
                ->find($entry->nJEVEntryId);
        });

        broadcast(new JournalEntryUpdated('created', $res->nJEVEntryId, $res->nJEVId))->toOthers();
        return response()->json($res, 201);
    }

    // Update Entry
    public function update(Request $request, $id)
    {
        $entry = JevEntries::find($id);
        if (!$entry) return response()->json(['message' => 'Not Found'], 404);

        $entry->update([
            'nJEVId'            => $request->nJEVId ?? $entry->nJEVId,
            'nJournalAccountId' => $request->nJournalAccountId ?? $entry->nJournalAccountId,
            'dAmount'           => $request->dAmount ?? $entry->dAmount,
        ]);

        $res = JevEntries::with(['jev', 'journal_account.client', 'journal_account.supplier'])->find($id);
        broadcast(new JournalEntryUpdated('updated', $res->nJEVEntryId, $res->nJEVId))->toOthers();
        return response()->json($res);
    }

    // Delete Entry
    public function destroy($id)
    {
        $res = JevEntries::find($id);
        if (!$res) return response()->json(['message' => 'Not Found'], 404);

        $jevEntryId = $res->nJEVEntryId;
        $jevId = $res->nJEVId;
        $res->delete();
        broadcast(new JournalEntryUpdated('deleted', $jevEntryId, $jevId))->toOthers();
        return response()->json(['message' => 'Deleted Successfully']);
    }
}
