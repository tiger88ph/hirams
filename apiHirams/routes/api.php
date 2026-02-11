<?php

use App\Models\Transactions;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PricingSetController;
use App\Http\Controllers\Api\ItemPricingController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\SupplierBankController;
use App\Http\Controllers\Api\PurchaseOptionsController;
use App\Http\Controllers\Api\SupplierContactController;
use App\Http\Controllers\Api\TransactionItemsController;
//LOG IN
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('suppliers/all', [SupplierController::class, 'allSuppliers']);
Route::apiResource('companies', CompanyController::class); // company management
Route::apiResource('users', UserController::class); // user management
Route::apiResource('clients', ClientController::class); // client management
Route::patch('clients/{id}/status', [ClientController::class, 'updateStatus']); // Change client status
Route::patch('suppliers/{id}/status', [SupplierController::class, 'updateStatus']); // Change client status
Route::patch('users/{id}/status', [UserController::class, 'updateStatus']); // Change client status
Route::get('client/active', [ClientController::class, 'activeClients']); // display active clients on procurement
Route::apiResource('suppliers', SupplierController::class); // supplier management
Route::apiResource('supplier-banks', SupplierBankController::class); //supplier bank management
Route::apiResource('supplier-contacts', SupplierContactController::class); //supplier bank management
Route::put('/transactions/{id}/assign', [TransactionController::class, 'assignAO']);
Route::get('/transactions/{id}/history', [TransactionController::class, 'getHistory']);
//procurement
Route::apiResource('transactions', TransactionController::class);
Route::get('transaction/procurement', [TransactionController::class, 'indexProcurement']);
Route::put('/transactions/{id}/finalize', [TransactionController::class, 'finalizetransaction']);
Route::put('/transactions/{id}/verify', [TransactionController::class, 'verifytransaction']);
Route::put('/transactions/{id}/revert', [TransactionController::class, 'revert']);
Route::get('transactions/{id}/pricing', [TransactionController::class, 'getPricingModalData']);
//account officer
Route::get('transaction/account_officer', [TransactionController::class, 'indexAccountOfficer']);
Route::get('/transactions/{transactionId}/items', [TransactionItemsController::class, 'getItemsByTransaction']);
Route::apiResource('purchase-options', PurchaseOptionsController::class);
Route::apiResource('transaction-items', TransactionItemsController::class);
Route::put('/transactions/{id}/finalize-ao', [TransactionController::class, 'finalizetransactionAO']);
Route::put('/transactions/{id}/finalize-ao-canvas', [TransactionController::class, 'finalizetransactionAOC']);
Route::put('/transactions/{id}/verify-ao', [TransactionController::class, 'verifytransactionAO']);
Route::put('/transactions/{id}/verify-ao-canvas', [TransactionController::class, 'verifytransactionAOC']);
// Add a route for updating the order
Route::put('transactions/items/update-order', [TransactionItemsController::class, 'updateOrder']);
Route::get("mappings/{type?}", [MappingController::class, 'getMappings']);
Route::put('/purchase-options/{id}/update-specs', [PurchaseOptionsController::class, 'updateSpecs']);
Route::put('/transaction-item/{id}/update-specs', [TransactionItemsController::class, 'updateSpecs']);
Route::get(
    '/transaction-items/{itemId}/purchase-options',
    [PurchaseOptionsController::class, 'getByItem']
);
Route::post('users/check-exist', [UserController::class, 'checkExist']);

//exporting
Route::post('export-transaction', [ExportController::class, 'downloadTransactionExcel']);
Route::post('export-breakdown', [ExportController::class, 'exportBreakdown']);
Route::get('dashboard/total-metrics', [DashboardController::class, 'totalMetrics']);
Route::patch('pricing-sets/{id}/choose', [PricingSetController::class, 'choose']);
Route::apiResource('pricing-sets', PricingSetController::class);
Route::apiResource('item-pricings', ItemPricingController::class);
// Additional custom routes
Route::post('item-pricings/bulk', [ItemPricingController::class, 'bulkStore']);
Route::get('item-pricings/pricing-set/{pricingSetId}', [ItemPricingController::class, 'getByPricingSet']);
Route::delete('item-pricings/pricing-set/{pricingSetId}', [ItemPricingController::class, 'deleteByPricingSet']);