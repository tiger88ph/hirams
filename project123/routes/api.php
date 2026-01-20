<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SupplierController;

// GET all suppliers with banks and contacts
Route::get('suppliers', [SupplierController::class, 'index']);
