<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\UserController;

Route::apiResource('companies', CompanyController::class); // company management
Route::apiResource('users', UserController::class); // user management