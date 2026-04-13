<?php


use App\Http\Controllers\Leave\LeaveController;
use App\Http\Controllers\Leave\LeaveFilingController;
use App\Http\Controllers\Leave\LeaveRequestController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

    // Leave routes
    Route::prefix('leave')->name('leave.')->group(function () {
        Route::get('/balances',               [LeaveController::class,        'balances'])->name('balances');
        Route::get('/file',                   [LeaveFilingController::class,  'index'])->name('file');
        Route::post('/file',                  [LeaveFilingController::class,  'store'])->name('file.store');
        Route::get('/requests',               [LeaveRequestController::class, 'index'])->name('requests');
        Route::get('/requests/appeals',       [LeaveRequestController::class, 'appeals'])->name('requests.appeals');
        Route::get('/staff/requests',         [LeaveRequestController::class, 'staffRequests'])->name('staff.requests');
        Route::get('/staff/appeals',          [LeaveRequestController::class, 'staffAppeals'])->name('staff.appeals');
        Route::post('/requests/{id}/approve', [LeaveRequestController::class, 'approve'])->name('requests.approve');
        Route::post('/requests/{id}/reject',  [LeaveRequestController::class, 'reject'])->name('requests.reject');
    });
});
