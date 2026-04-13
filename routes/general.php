<?php

use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Controllers\Leave\LeaveController;
use App\Http\Controllers\Leave\LeaveFilingController;
use App\Http\Controllers\Leave\LeaveRequestController;
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
  });

  Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');
});
