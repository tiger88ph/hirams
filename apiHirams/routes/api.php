<?php

use App\Http\Controllers\Api\AssigneeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectCostController;
use App\Http\Controllers\Api\DirectCostOptionsController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ItemPricingController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\PricingSetController;
use App\Http\Controllers\Api\PurchaseItemHistoryController;
use App\Http\Controllers\Api\PurchaseOptionsController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\PurchaseOrderOptionsController;
use App\Http\Controllers\Api\SerialNumberController;
use App\Http\Controllers\Api\SupplierBankController;
use App\Http\Controllers\Api\SupplierContactController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransactionItemsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherAssigneeController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\VoucherSupplierController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC ──────────────────────────────────────────────────
Route::get('mappings/{type?}', [MappingController::class, 'getMappings']); // ← move outside
Route::post('users/check-exist',  [UserController::class, 'checkExist']);
Route::get('transactions/{id}/full', [TransactionController::class, 'showFull']);
Route::get('transactions/full', [TransactionController::class, 'showFullTransactionData']);
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

// ── PROTECTED ───────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/verify-password', [AuthController::class, 'verifyPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('dashboard/profit-by-month', [DashboardController::class, 'profitByMonth']);
    Route::get('dashboard/employee-performance', [DashboardController::class, 'employeePerformance']);
    Route::get('dashboard/total-metrics', [DashboardController::class, 'totalMetrics']);
    Route::get('dashboard/ongoing-transactions', [DashboardController::class, 'ongoingTransactions']);
    Route::get('users/active-account-officers', [UserController::class, 'activeAccountOfficers']);
    Route::get('users/active-procurement', [UserController::class, 'activeProcurement']);


    Route::patch('users/{id}/status',        [UserController::class, 'updateStatus']);
    Route::patch('users/{id}/password',      [UserController::class, 'updatePassword']);
    Route::post('users/{id}/profile-image', [UserController::class, 'uploadProfileImage']);
    Route::apiResource('users', UserController::class)->except(['store']);
    // COMPANIES
    Route::post('companies/{id}/logo', [CompanyController::class, 'uploadLogo']);
    Route::apiResource('companies', CompanyController::class);
    // CLIENTS
    Route::get('client/active',          [ClientController::class, 'activeClients']);
    Route::patch('clients/{id}/status',  [ClientController::class, 'updateStatus']);
    Route::apiResource('clients', ClientController::class);

    // SUPPLIERS
    Route::get('suppliers/all',           [SupplierController::class, 'allSuppliers']);
    Route::patch('suppliers/{id}/status', [SupplierController::class, 'updateStatus']);
    Route::get('suppliers/{supplierId}/banks',    [SupplierBankController::class,    'bySupplier']);
    Route::get('suppliers/{supplierId}/contacts', [SupplierContactController::class, 'bySupplier']);
    Route::get('supplier-contacts/by-supplier/{supplierId}', [SupplierContactController::class, 'bySupplier']);
    Route::apiResource('suppliers',         SupplierController::class);
    Route::apiResource('supplier-banks',    SupplierBankController::class);
    Route::apiResource('supplier-contacts', SupplierContactController::class);
    Route::put('transactions/{id}/approve-pricing', [TransactionController::class, 'approveTransactionPricing']);
    // TRANSACTIONS — PROCUREMENT
    Route::get('transaction/finance', [TransactionController::class, 'indexFinance']);
    Route::get('transaction/procurement',                   [TransactionController::class, 'indexProcurement']);
    Route::put('/transactions/{id}/assign',                 [TransactionController::class, 'assignAO']);
    Route::post('/transactions/{id}/assign-procurement',    [TransactionController::class, 'assignProcurement']);
    Route::post('/transactions/{id}/archive',   [TransactionController::class, 'archive']);
    Route::post('/transactions/{id}/unarchive', [TransactionController::class, 'unarchive']);
    Route::get('/transactions/archive/account_officer', [TransactionController::class, 'indexAccountOfficerArchive']);
    Route::get('/transactions/archive/procurement',     [TransactionController::class, 'indexProcurementArchive']);
    Route::get('/transactions/archive', [TransactionController::class, 'indexArchive']);
    Route::put('transactions/{id}/for-collection', [TransactionController::class, 'forCollection']);
    Route::put('/transactions/{id}/finalize',               [TransactionController::class, 'finalizetransaction']);
    Route::put('/transactions/{id}/verify',                 [TransactionController::class, 'verifytransaction']);
    Route::put('/transactions/{id}/revert',                 [TransactionController::class, 'revert']);
    Route::get('/transactions/{id}/history',                [TransactionController::class, 'getHistory']);
    Route::get('transactions/{id}/pricing',                 [TransactionController::class, 'getPricingModalData']);
    Route::put('/transactions/{id}/finalize-pricing',       [TransactionController::class, 'finalizeTransactionPricing']);
    Route::put('/transactions/{id}/verify-pricing',         [TransactionController::class, 'verifyTransactionPricing']);
    Route::put('/transactions/{id}/force-finalize',         [TransactionController::class, 'forceFinalizeManagement']);
    Route::apiResource('transactions',                      TransactionController::class);

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
    Route::get('transaction-items/suggestions',             [TransactionItemsController::class, 'getSuggestions']);
    Route::apiResource('transaction-items',                 TransactionItemsController::class);
    Route::post('transactions/{transactionId}/items/bulk',  [TransactionItemsController::class, 'bulkStore']);
    // PURCHASE OPTIONS
    Route::get('/transaction-items/{itemId}/purchase-options', [PurchaseOptionsController::class, 'getByItem']);
    Route::get('/transaction-items/{itemId}/addons',           [PurchaseOptionsController::class, 'getAddOnsByItem']);
    Route::put('/purchase-options/{id}/update-specs',          [PurchaseOptionsController::class, 'updateSpecs']);
    Route::post('purchase-options/calculate-ewt',              [PurchaseOptionsController::class, 'calculateEWT']);
    Route::get('purchase-options/suggestions', [PurchaseOptionsController::class, 'getSuggestions']);
    Route::apiResource('purchase-options', PurchaseOptionsController::class);

    // PRICING SETS
    Route::patch('pricing-sets/{id}/choose', [PricingSetController::class, 'choose']);
    Route::apiResource('pricing-sets', PricingSetController::class);

    Route::post('item-pricings/bulkStore', [ItemPricingController::class, 'bulkStore']);
    Route::get('item-pricings/pricing-set/{pricingSetId}',    [ItemPricingController::class, 'getByPricingSet']);
    Route::delete('item-pricings/pricing-set/{pricingSetId}', [ItemPricingController::class, 'deleteByPricingSet']);
    Route::get('item-pricings/tax', [ItemPricingController::class, 'getTax']);
    Route::apiResource('item-pricings', ItemPricingController::class);

    // DIRECT COSTS
    Route::apiResource('direct-cost-options', DirectCostOptionsController::class);
    Route::apiResource('direct-cost',         DirectCostController::class);

    // EXPORTS
    Route::post('export/export-dr', [ExportController::class, 'exportDr']);
    Route::post('export/preview-dr', [ExportController::class, 'previewDr']);
    Route::post('export/preview-si', [ExportController::class, 'previewSi']);
    Route::post('purchase-order/export', [ExportController::class, 'exportPurchaseOrder']);
    Route::post('purchase-order/preview', [ExportController::class, 'previewPurchaseOrder']);
    Route::post('voucher/preview', [ExportController::class, 'previewVoucher']);
    Route::post('voucher/preview-cheque', [ExportController::class, 'previewCheque']);
    Route::post('voucher/export', [ExportController::class, 'exportVoucher']);
    Route::post('voucher/export-cheque', [ExportController::class, 'exportCheque']);
    Route::post('export/purchase-order', [ExportController::class, 'exportPurchaseOrder']);
    Route::post('export-transaction',    [ExportController::class, 'downloadTransactionExcel']);
    Route::post('export-pricing-report', [ExportController::class, 'exportSellingPriceReport']);
    Route::post('purchase-order/sync-status', [PurchaseOrderController::class, 'syncPurchaseOrderStatus']);
    Route::patch('purchase-orders/update-cart-status', [PurchaseOrderController::class, 'updateCartStatus']);
    Route::patch('purchase-orders/update-cart-status-bulk', [PurchaseOrderController::class, 'updateCartStatusBulk']);
    Route::patch('purchase-orders/proceed-to-payment', [PurchaseOrderController::class, 'proceedToPayment']);
    Route::post('purchase-order/remove-from-cart', [PurchaseOrderOptionsController::class, 'removeFromCart']);
    Route::post('purchase-order/add-to-cart', [PurchaseOrderOptionsController::class, 'addToCart']);
    Route::get('purchase-orders/get-all-purchase-orders', [PurchaseOrderController::class, 'getAllPurchaseOrders']);
    Route::post('purchase-item-histories/latest', [PurchaseItemHistoryController::class, 'latestPurchaseOrderOptionsHistory']);
    Route::get('purchase-item-histories/option/{nPurchaseOptionId}/all', [PurchaseItemHistoryController::class, 'allOptionHistory']);
    // ASSIGNEES
    Route::patch('assignees/{id}/status', [AssigneeController::class, 'updateStatus']);
    Route::post('assignees/check-exist',  [AssigneeController::class, 'checkExist']);

    // VOUCHERS
    Route::patch('vouchers/{id}/status', [VoucherController::class, 'updateStatus']);
    Route::apiResource('vouchers',          VoucherController::class);
    Route::apiResource('voucher-suppliers', VoucherSupplierController::class);
    Route::apiResource('voucher-assignees', VoucherAssigneeController::class);
    Route::apiResource('assignees',         AssigneeController::class);

    Route::get('purchase-orders/by-supplier', [PurchaseOrderController::class, 'getBySupplier']);
    Route::get(
        'inventory/all',
        [InventoryController::class, 'getInventory']
    );
    Route::get('inventory/history', [InventoryController::class, 'history']);
    Route::apiResource('inventory', InventoryController::class);
    Route::apiResource('serial-numbers', SerialNumberController::class);
    Route::get('serial-numbers/by-inventory/{inventoryId}', [SerialNumberController::class, 'byInventory']);
    Route::post('serial-numbers/check-exist', [SerialNumberController::class, 'checkExist']);
});

Route::apiResource('users', UserController::class);
