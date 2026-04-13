<?php

use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Controllers\Leave\LeaveController;
use App\Http\Controllers\Leave\LeaveFilingController;
use App\Http\Controllers\Admin\LeavePolicyController;
use App\Http\Controllers\Admin\VlAccrualTierController;
use App\Http\Controllers\Admin\HolidayController;
use App\Http\Controllers\Admin\YearEndConfigController;
use App\Http\Controllers\Admin\EmployeeBalanceController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/admin", [AdminController::class, 'index'])->name('admin');
    Route::get("/admin/employees", [EmployeeBalanceController::class, 'employees'])->name('admin.employees');
    Route::get("/new-admin", [AdminController::class, 'index_addAdmin'])->name('index_addAdmin');
    Route::post("/add-admin", [AdminController::class, 'addAdmin'])->name('addAdmin');
    Route::post("/remove-admin", [AdminController::class, 'removeAdmin'])->name('removeAdmin');
    Route::patch("/change-admin-role", [AdminController::class, 'changeAdminRole'])->name('changeAdminRole');

    // ── Leave Management Admin ──────────────────────────────────────
    Route::prefix('admin/leave')->name('admin.leave.')->group(function () {

      // Leave Policy
      Route::get('/policy',              [LeavePolicyController::class, 'index'])->name('policy');
      Route::post('/policy',             [LeavePolicyController::class, 'store'])->name('policy.store');
      Route::patch('/policy/{id}',       [LeavePolicyController::class, 'update'])->name('policy.update');
      Route::patch('/policy/{id}/toggle',[LeavePolicyController::class, 'toggleActive'])->name('policy.toggle');

      // VL Accrual Tiers
      Route::get('/accrual-tiers',       [VlAccrualTierController::class, 'index'])->name('accrual-tiers');
      Route::post('/accrual-tiers',      [VlAccrualTierController::class, 'store'])->name('accrual-tiers.store');
      Route::patch('/accrual-tiers/{id}',[VlAccrualTierController::class, 'update'])->name('accrual-tiers.update');
      Route::delete('/accrual-tiers/{id}',[VlAccrualTierController::class, 'destroy'])->name('accrual-tiers.destroy');

      // Holidays
      Route::get('/holidays',            [HolidayController::class, 'index'])->name('holidays');
      Route::post('/holidays',           [HolidayController::class, 'store'])->name('holidays.store');
      Route::patch('/holidays/{id}',     [HolidayController::class, 'update'])->name('holidays.update');
      Route::delete('/holidays/{id}',    [HolidayController::class, 'destroy'])->name('holidays.destroy');

      // Year-End Config
      Route::get('/year-end',            [YearEndConfigController::class, 'index'])->name('year-end');
      Route::post('/year-end',           [YearEndConfigController::class, 'store'])->name('year-end.store');
      Route::patch('/year-end/{id}',     [YearEndConfigController::class, 'update'])->name('year-end.update');
      Route::get('/year-end/{id}/logs',  [YearEndConfigController::class, 'logs'])->name('year-end.logs');

      // Employee Balances
      Route::get('/balances',                      [EmployeeBalanceController::class, 'index'])->name('balances');
      Route::post('/balances/adjust',              [EmployeeBalanceController::class, 'adjust'])->name('balances.adjust');
      Route::get('/balances/{employid}/logs',      [EmployeeBalanceController::class, 'logs'])->name('balances.logs');
    });
  });

  Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');

  // Leave routes
  Route::prefix('leave')->name('leave.')->group(function () {
    Route::get('/balances', [LeaveController::class,       'balances'])->name('balances');
    Route::get('/file',     [LeaveFilingController::class, 'index'])->name('file');
    Route::post('/file',    [LeaveFilingController::class, 'store'])->name('file.store');
  });
});
