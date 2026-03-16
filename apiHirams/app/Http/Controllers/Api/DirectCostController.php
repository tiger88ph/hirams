<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\DirectCost;
use App\Models\PurchaseOptions;
use Illuminate\Http\Request;
class DirectCostController extends Controller
{
public function index(Request $request)
{
    $costs = DirectCost::where('nTransactionID', $request->nTransactionID)
        ->orderBy('nDirectCostID')
        ->get();

    $totalEWT = 0;
    if ($request->boolean('withEWT')) {
        $totalEWT = (float) PurchaseOptions::whereHas('transactionItem', function ($q) use ($request) {
                $q->where('nTransactionId', $request->nTransactionID);
            })
            ->where('bIncluded', 1)
            ->sum('dEWT');
    }

    return response()->json([
        'success'     => true,
        'directCosts' => $costs,
        'totalEWT'    => $totalEWT,
    ]);
}
    public function store(Request $request)
    {
        $data = $request->validate([
            'nTransactionID' => 'required|integer',
            'nDirectCostOptionID' => 'required|integer',
            'dAmount' => 'required|numeric'
        ]);
        return DirectCost::create($data);
    }
    public function show($id)
    {
        return DirectCost::with('option')->findOrFail($id);
    }
    public function update(Request $request, $id)
    {
        $cost = DirectCost::findOrFail($id);
        $data = $request->validate([
            'nTransactionID' => 'required|integer',
            'nDirectCostOptionID' => 'required|integer',
            'dAmount' => 'required|numeric'
        ]);
        $cost->update($data);
        return $cost;
    }
    public function destroy($id)
    {
        DirectCost::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}