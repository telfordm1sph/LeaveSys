<?php

namespace App\Console\Commands;

use App\Services\LeaveAutoUpdateService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RunLeaveAutoUpdate extends Command
{
    protected $signature = 'leave:auto-update
                            {--employee= : Process a single employee ID (for testing)}
                            {--date=     : Override today\'s date (YYYY-MM-DD, for back-testing)}';

    protected $description = 'Run the daily leave auto-update: accrual, yearly reset, and year-end processing.';

    public function __construct(
        protected LeaveAutoUpdateService $service
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dateOverride = $this->option('date');
        $today        = $dateOverride ? Carbon::parse($dateOverride) : Carbon::today();

        $this->line('');
        $this->info("  Leave Auto-Update — {$today->toDateString()}");
        $this->line('  ' . str_repeat('─', 50));

        // Single-employee mode (for testing / manual correction)
        if ($employid = $this->option('employee')) {
            $this->line("  Running for employee <fg=yellow>{$employid}</> only…");
            $fired = $this->service->processEmployee((int) $employid, $today);
            $this->line('');
            $this->info($fired
                ? "  ✓ Employee {$employid} — one or more blocks fired."
                : "  – Employee {$employid} — no blocks triggered (already up to date or invalid data)."
            );
            // Still run Block E in single-employee mode
            $this->service->runBlockE($today);
            return self::SUCCESS;
        }

        // Full run
        $this->line('  Fetching active employees from HRIS…');
        $result = $this->service->run();

        $this->line('');
        $this->table(
            ['Updated', 'Skipped', 'Errors'],
            [[$result['updated'], $result['skipped'], $result['errors']]]
        );

        if ($result['errors'] > 0) {
            $this->warn("  {$result['errors']} error(s) — check storage/logs/laravel.log for details.");
            return self::FAILURE;
        }

        $this->info('  Done.');
        $this->line('');

        return self::SUCCESS;
    }
}
