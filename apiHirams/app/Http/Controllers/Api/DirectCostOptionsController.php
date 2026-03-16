<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\DirectCostUpdated;
use App\Models\DirectCostOptions;
use Illuminate\Http\Request;

class DirectCostOptionsController extends Controller
{
    public function index()
    {
        return DirectCostOptions::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'strName' => 'required|string|max:20',
        ]);

        $option = DirectCostOptions::create($data);

        broadcast(new DirectCostUpdated('created', $option->nDirectCostOptionID))->toOthers();

        return $option;
    }

    public function show($id)
    {
        return DirectCostOptions::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $option = DirectCostOptions::findOrFail($id);

        $data = $request->validate([
            'strName' => 'required|string|max:20',
        ]);

        $option->update($data);

        broadcast(new DirectCostUpdated('updated', $option->nDirectCostOptionID))->toOthers();

        return $option;
    }

    public function destroy($id)
    {
        $option = DirectCostOptions::findOrFail($id);
        $option->delete();

        broadcast(new DirectCostUpdated('deleted', (int) $id))->toOthers();

        return response()->json(['message' => 'Deleted']);
    }
}