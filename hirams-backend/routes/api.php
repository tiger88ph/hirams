<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\SupplierBankController;
use App\Http\Controllers\Api\SupplierContactController;
use App\Http\Controllers\Api\TransactionController;
use App\Models\Transactions;
use App\Http\Controllers\Api\AuthController;

//LOG IN
Route::post('/login', [AuthController::class, 'login']);

Route::apiResource('companies', CompanyController::class); // company management
Route::apiResource('users', UserController::class); // user management
Route::apiResource('clients', ClientController::class); // client management
Route::patch('clients/{id}/status', [ClientController::class, 'updateStatus']); // Change client status
Route::apiResource('suppliers', SupplierController::class); // supplier management
Route::apiResource('supplier-banks', SupplierBankController::class); //supplier bank management
Route::apiResource('supplier-contacts', SupplierContactController::class); //supplier bank management
Route::put('/transactions/{id}/assign', [TransactionController::class, 'assignAO']);

//procurement
Route::apiResource('transactions', TransactionController::class);
Route::get('transaction/procurement', [TransactionController::class, 'indexProcurement']);
Route::put('/transactions/{id}/finalize', [TransactionController::class, 'finalizetransaction']);
Route::put('/transactions/{id}/revert', [TransactionController::class, 'revert']);
Route::get('transactions/{id}/pricing', [TransactionController::class, 'getPricingModalData']);



//Data mapping
Route::get("mappings/{type?}", [MappingController::class, 'getMappings']);