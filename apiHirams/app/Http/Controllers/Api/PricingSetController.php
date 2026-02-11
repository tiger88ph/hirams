<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PricingSet;
use Illuminate\Support\Facades\DB;

class PricingSetController extends Controller
{
    /**
     * ---------------------------------------
     * GET /pricing-sets
     * Query: nTransactionId
     * ---------------------------------------
     */
    public function index(Request $request)
    {
        $transactionId = $request->query('nTransactionId');
        $query = PricingSet::withCount('itemPricings');

        if ($transactionId) {
            $query->where('nTransactionId', $transactionId);
        }

        return response()->json([
            'data' => $query->orderByDesc('bChosen')
                ->orderByDesc('nPricingSetId')
                ->get()
        ]);
    }

    /**
     * ---------------------------------------
     * POST /pricing-sets
     * ---------------------------------------
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nTransactionId' => 'required|integer',
            'strName'        => 'required|string|max:255'
        ]);

        $set = PricingSet::create([
            'nTransactionId' => $validated['nTransactionId'],
            'strName'        => $validated['strName'],
        ]);

        return response()->json([
            'data' => $set
        ], 201);
    }


    /**
     * ---------------------------------------
     * GET /pricing-sets/{id}
     * ---------------------------------------
     */
    public function show($id)
    {
        $set = PricingSet::with('itemPricings')->findOrFail($id);

        return response()->json([
            'data' => $set
        ]);
    }


    /**
     * ---------------------------------------
     * PUT/PATCH /pricing-sets/{id}
     * ---------------------------------------
     */
    public function update(Request $request, $id)
    {
        $set = PricingSet::findOrFail($id);

        $validated = $request->validate([
            'strName' => 'sometimes|required|string|max:255',
            'bChosen' => 'sometimes|boolean'
        ]);

        $set->update($validated);

        return response()->json([
            'data' => $set
        ]);
    }


    /**
     * ---------------------------------------
     * DELETE /pricing-sets/{id}
     * ---------------------------------------
     */
    public function destroy($id)
    {
        $set = PricingSet::findOrFail($id);
        $set->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }


    /**
     * ---------------------------------------
     * PATCH /pricing-sets/{id}/choose
     * Custom Action
     * ---------------------------------------
     */
    public function choose($id)
    {
        $set = PricingSet::findOrFail($id);
        DB::transaction(function () use ($set) {
            // If already chosen, unchoose it
            if ($set->bChosen == 1) {
                $set->update(['bChosen' => 0]);
            } else {
                // Otherwise, unchoose all and choose this one
                PricingSet::where('nTransactionId', $set->nTransactionId)
                    ->update(['bChosen' => 0]);
                $set->update(['bChosen' => 1]);
            }
        });
        return response()->json([
            'data' => $set
        ]);
    }
}
