<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MappingController extends Controller
{
     /**
     * Return one or all mappings defined in config/mappings.php
     */
    public function getMappings($type = null)
    {
        $mappings = config('mappings');

        if ($type && isset($mappings[$type])) {
            return response()->json($mappings[$type]);
        }

        return response()->json($mappings);
    }
}
