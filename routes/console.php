<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Leave auto-update — runs once daily at 00:05 ──────────────────────────────
// Processes Blocks A–E for all active employees:
//   A = Regularization (initialize yearly leaves)
//   B = First VL/SIL earning
//   C = Monthly VL/SIL accrual
//   D = Yearly reset (rates, SL/BL/EL/Bereavement)
//   E = Year-end VL carryover / conversion / forfeit
Schedule::command('leave:auto-update')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/leave_auto_update.log'));
