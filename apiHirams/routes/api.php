<?php

use App\Events\TransactionUpdated;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectCostController;
use App\Http\Controllers\Api\DirectCostOptionsController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ItemPricingController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\PricingSetController;
use App\Http\Controllers\Api\PurchaseOptionsController;
use App\Http\Controllers\Api\SendEmailController;
use App\Http\Controllers\Api\SupplierBankController;
use App\Http\Controllers\Api\SupplierContactController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransactionItemsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC ──────────────────────────────────────────────────
Route::get('mappings/{type?}', [MappingController::class, 'getMappings']); // ← move outside
Route::post('users/check-exist',  [UserController::class, 'checkExist']);

// Public auth routes (no middleware)
Route::prefix('auth')->group(function () {

    Route::post('/login',               [AuthController::class, 'login']);
    Route::post('/check-username',      [AuthController::class, 'checkUsername']);
    Route::post('/forgot-password',     [AuthController::class, 'forgotPassword']);
    Route::post('/validate-reset-token', [AuthController::class, 'validateResetToken']);
    Route::post('/reset-password',      [AuthController::class, 'resetPassword']);
    Route::post('/send-otp',             [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp',           [AuthController::class, 'verifyOtp']);
});
Route::patch('users/{id}/status', [UserController::class, 'updateStatus']);
Route::apiResource('users', UserController::class);
// ── PROTECTED ───────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/verify-password', [AuthController::class, 'verifyPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('dashboard/total-metrics', [DashboardController::class, 'totalMetrics']);

    Route::patch('users/{id}/status',        [UserController::class, 'updateStatus']);
    Route::patch('users/{id}/password',      [UserController::class, 'updatePassword']);
    Route::post('users/{id}/profile-image', [UserController::class, 'uploadProfileImage']);
    Route::apiResource('users', UserController::class)->except(['store']);
    // COMPANIES
    Route::apiResource('companies', CompanyController::class);
    // CLIENTS
    Route::get('client/active',          [ClientController::class, 'activeClients']);
    Route::patch('clients/{id}/status',  [ClientController::class, 'updateStatus']);
    Route::apiResource('clients', ClientController::class);

    // SUPPLIERS
    Route::get('suppliers/all',           [SupplierController::class, 'allSuppliers']);
    Route::patch('suppliers/{id}/status', [SupplierController::class, 'updateStatus']);
    Route::apiResource('suppliers',         SupplierController::class);
    Route::apiResource('supplier-banks',    SupplierBankController::class);
    Route::apiResource('supplier-contacts', SupplierContactController::class);

    // TRANSACTIONS — PROCUREMENT
    Route::get('transaction/procurement',                   [TransactionController::class, 'indexProcurement']);
    Route::put('/transactions/{id}/assign',                 [TransactionController::class, 'assignAO']);
    Route::put('/transactions/{id}/finalize',               [TransactionController::class, 'finalizetransaction']);
    Route::put('/transactions/{id}/verify',                 [TransactionController::class, 'verifytransaction']);
    Route::put('/transactions/{id}/revert',                 [TransactionController::class, 'revert']);
    Route::get('/transactions/{id}/history',                [TransactionController::class, 'getHistory']);
    Route::get('transactions/{id}/pricing',                 [TransactionController::class, 'getPricingModalData']);
    Route::put('/transactions/{id}/finalize-pricing',       [TransactionController::class, 'finalizeTransactionPricing']);
    Route::put('/transactions/{id}/verify-pricing',         [TransactionController::class, 'verifyTransactionPricing']);
    Route::apiResource('transactions', TransactionController::class);

    // TRANSACTIONS — ACCOUNT OFFICER
    Route::get('transaction/account_officer',               [TransactionController::class, 'indexAccountOfficer']);
    Route::put('/transactions/{id}/finalize-ao',            [TransactionController::class, 'finalizetransactionAO']);
    Route::put('/transactions/{id}/finalize-ao-canvas',     [TransactionController::class, 'finalizetransactionAOC']);
    Route::put('/transactions/{id}/verify-ao',              [TransactionController::class, 'verifytransactionAO']);
    Route::put('/transactions/{id}/verify-ao-canvas',       [TransactionController::class, 'verifytransactionAOC']);

    // TRANSACTION ITEMS
    Route::put('transactions/items/update-order',           [TransactionItemsController::class, 'updateOrder']);
    Route::get('/transactions/{transactionId}/items',       [TransactionItemsController::class, 'getItemsByTransaction']);
    Route::put('/transaction-item/{id}/update-specs',       [TransactionItemsController::class, 'updateSpecs']);
    Route::apiResource('transaction-items', TransactionItemsController::class);
    Route::post('transactions/{transactionId}/items/bulk', [TransactionItemsController::class, 'bulkStore']);
    // PURCHASE OPTIONS
    Route::get('/transaction-items/{itemId}/purchase-options', [PurchaseOptionsController::class, 'getByItem']);
    Route::get('/transaction-items/{itemId}/addons',           [PurchaseOptionsController::class, 'getAddOnsByItem']);
    Route::put('/purchase-options/{id}/update-specs',          [PurchaseOptionsController::class, 'updateSpecs']);
    Route::post('purchase-options/calculate-ewt',              [PurchaseOptionsController::class, 'calculateEWT']);
    Route::apiResource('purchase-options', PurchaseOptionsController::class);

    // PRICING SETS
    Route::patch('pricing-sets/{id}/choose', [PricingSetController::class, 'choose']);
    Route::apiResource('pricing-sets', PricingSetController::class);

    Route::post('item-pricings/bulkStore', [ItemPricingController::class, 'bulkStore']);
    Route::get('item-pricings/pricing-set/{pricingSetId}',    [ItemPricingController::class, 'getByPricingSet']);
    Route::delete('item-pricings/pricing-set/{pricingSetId}', [ItemPricingController::class, 'deleteByPricingSet']);
    Route::apiResource('item-pricings', ItemPricingController::class);

    // DIRECT COSTS
    Route::apiResource('direct-cost-options', DirectCostOptionsController::class);
    Route::apiResource('direct-cost',         DirectCostController::class);

    // EXPORTS
    Route::post('export-transaction',    [ExportController::class, 'downloadTransactionExcel']);
    Route::post('export-pricing-report', [ExportController::class, 'exportSellingPriceReport']);
});
