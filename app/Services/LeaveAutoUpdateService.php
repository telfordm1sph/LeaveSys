<?php

namespace App\Services;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualLog;
use App\Models\LeavePolicy;
use App\Models\SystemStatus;
use App\Models\VlAccrualTier;
use App\Models\YearEndConfig;
use App\Models\YearEndConversionLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveAutoUpdateService
{
    // The cut-off date that separates legacy hires (step-up VL) from new hires (fixed VL)
    private const LEGACY_CUTOFF = '2024-03-30';

    // SIL applies to PL8 employees whose EMPLOYID starts with '30'
    private const SIL_PRODLINE  = 'PL8';
    private const SIL_ID_PREFIX = '30';

    // Block B: ignore employees whose first earning date is more than this many months in the past
    private const FIRST_EARN_WINDOW_MONTHS = 6;

    public function __construct(
        protected HrisApiService $hris
    ) {}

    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================

    /**
     * Run the full daily auto-update for all active employees.
     * Mirrors the old auto_update_vl_and_vlincr() but uses the new schema.
     */
    public function run(): array
    {
        $today   = Carbon::today();
        $started = now();

        $this->setSystemStatus('maintenance', 'System is updating leave credits. Please wait…');

        Log::info('[LeaveAutoUpdate] Starting daily run', ['date' => $today->toDateString()]);

        // Collect employee IDs from local leave balances — covers all employees who
        // have at least one leave balance row (Blocks B-E).  Block A initializes new
        // regulars whose SL row doesn't exist yet, so they are detected inside
        // processEmployee() when the HRIS work-detail confirms emp_status = 2.
        $employeeIds = EmployeeLeaveBalance::select('employid')
            ->distinct()
            ->pluck('employid')
            ->toArray();

        if (empty($employeeIds)) {
            Log::warning('[LeaveAutoUpdate] No employees found in leave_employee_balance.');
            $this->setSystemStatus('online', 'System is running normally');
            return ['updated' => 0, 'skipped' => 0, 'errors' => 0];
        }

        $updated = 0;
        $skipped = 0;
        $errors  = 0;

        foreach ($employeeIds as $employid) {
            try {
                $result = $this->processEmployee((int) $employid, $today);

                if ($result === true)       $updated++;
                elseif ($result === false)  $skipped++;
            } catch (\Throwable $e) {
                $errors++;
                Log::error("[LeaveAutoUpdate] EMPLOYID {$employid}: " . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        // Block E: Year-end processing (runs after all employees are updated)
        $this->runBlockE($today);

        $summary = "{$updated} updated, {$skipped} skipped, {$errors} errors.";
        Log::info("[LeaveAutoUpdate] Done — {$summary}", ['duration_s' => now()->diffInSeconds($started)]);

        $this->setSystemStatus('online', 'System is running normally');

        return compact('updated', 'skipped', 'errors');
    }

    /**
     * Process all applicable blocks for a single employee.
     * Returns true if any block fired, false if all skipped, null on data error.
     */
    public function processEmployee(int $employid, Carbon $today): bool
    {
        $work = $this->hris->fetchWorkDetails($employid);

        if (!$this->hris->isValidWorkData($work)) {
            Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Skipped — invalid or missing work data");
            return false;
        }

        // Skip separated/inactive employees
        if ((int) $work['acc_status'] === 2) {
            return false;
        }

        $fired = false;

        $fired = $this->runBlockA($employid, $work, $today) || $fired;
        $fired = $this->runBlockB($employid, $work, $today) || $fired;
        $fired = $this->runBlockC($employid, $work, $today) || $fired;
        $fired = $this->runBlockD($employid, $work, $today) || $fired;

        return $fired;
    }

    // =========================================================================
    // BLOCK A — REGULARIZATION
    // Trigger: emp_status = 2 (regular) AND no SL balance row exists yet
    //
    // Old system wrote EMPSTATUS = 1 back to the masterlist.
    // New system: HRIS owns that data. We just initialize leave rows.
    //
    // What it does:
    //   - Creates SL row (yearly_grant_minutes from leave_policy)
    //   - Creates BL row (legacy hires only)
    //   - Creates EL row (legacy hires only)
    //   - Creates Bereavement row (all hires)
    //   - Logs each creation as 'yearly_reset'
    // =========================================================================
    private function runBlockA(int $employid, array $work, Carbon $today): bool
    {
        // Only regular employees
        if ((int) $work['emp_status'] !== 1) {
            return false;
        }

        // Guard: SL row already exists → Block A already ran for this employee
        $alreadyInitialized = EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', 'SL')
            ->exists();

        if ($alreadyInitialized) {
            return false;
        }

        $isLegacy   = strtotime($work['date_hired']) <= strtotime(self::LEGACY_CUTOFF);
        $nextJan1   = Carbon::create($today->year + 1, 1, 1);

        // Yearly leave types to initialize, with their hire tier restriction
        $yearlyTypes = LeavePolicy::whereIn('leave_type', ['SL', 'BL', 'EL', 'BEREAVEMENT'])
            ->where('is_active', 1)
            ->get()
            ->keyBy('leave_type');

        $fired = false;

        foreach ($yearlyTypes as $leaveType => $policy) {
            // Tier check: skip if this type is restricted to legacy/new and employee doesn't match
            if ($policy->applies_to_hire_tier === 'legacy' && !$isLegacy) continue;
            if ($policy->applies_to_hire_tier === 'new'    && $isLegacy)  continue;

            $minutes = (int) $policy->yearly_grant_minutes;

            EmployeeLeaveBalance::create([
                'employid'             => $employid,
                'leave_type'           => $leaveType,
                'balance_minutes'      => $minutes,
                'monthly_rate_minutes' => null,
                'next_accrual_date'    => null,
                'next_yearly_date'     => $nextJan1->toDateString(),
                'first_earned_at'      => $today->toDateString(),
            ]);

            $this->writeLog(
                $employid,
                $leaveType,
                'yearly_reset',
                0,
                $minutes,
                $minutes,
                null,
                "Block A — {$leaveType} initialized upon regularization",
                'system'
            );

            $fired = true;
        }

        if ($fired) {
            Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Block A — yearly leaves initialized");
        }

        return $fired;
    }

    // =========================================================================
    // BLOCK B — FIRST VL / SIL EARNING
    // Trigger: emp_status = 2 AND no VL/SIL row with first_earned_at set
    //          AND today >= firstEarningDate (end of month after DATEREG)
    //          AND within 6-month window from firstEarningDate
    //
    // What it does:
    //   - Looks up monthly_minutes from vl_accrual_tier (year 0, employee tier)
    //   - Creates VL (or SIL) row with initial balance = monthly_minutes
    //   - Sets first_earned_at, next_accrual_date, next_yearly_date
    //   - Logs as 'accrual'
    // =========================================================================
    private function runBlockB(int $employid, array $work, Carbon $today): bool
    {
        if ((int) $work['emp_status'] !== 2) {
            return false;
        }

        $isSpecialSIL = $this->isSpecialSILEmployee($employid, $work);
        $leaveType    = $isSpecialSIL ? 'SIL' : 'VL';

        // Guard: row already exists with first_earned_at → Block B already fired
        $existing = EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', $leaveType)
            ->first();

        if ($existing && $existing->first_earned_at) {
            return false;
        }

        // First earning date = last day of the month after DATEREG
        $firstEarningDate = Carbon::parse($work['date_reg'])->addMonth()->endOfMonth();

        if ($today->lt($firstEarningDate)) {
            return false;
        }

        // 6-month window — prevents awarding first leave to long-missed employees
        if ($today->gt($firstEarningDate->copy()->addMonths(self::FIRST_EARN_WINDOW_MONTHS))) {
            Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Block B skipped — more than 6 months past first earning date");
            return false;
        }

        $tier         = $this->getHireTier($work['date_hired']);
        $monthlyMinutes = $this->lookupAccrualRate($tier, 0);

        if ($monthlyMinutes === null) {
            Log::warning("[LeaveAutoUpdate] EMPLOYID {$employid}: Block B — no accrual tier found for tier={$tier}, year=0");
            return false;
        }

        $nextAccrualDate = $today->copy()->addMonth()->startOfMonth();
        $nextYearlyDate  = Carbon::create($today->year + 1, 1, 1);

        if ($existing) {
            // Row exists but first_earned_at is null — update it
            $before = $existing->balance_minutes;
            $after  = $before + $monthlyMinutes;
            $existing->update([
                'balance_minutes'      => $after,
                'monthly_rate_minutes' => $monthlyMinutes,
                'next_accrual_date'    => $nextAccrualDate->toDateString(),
                'next_yearly_date'     => $nextYearlyDate->toDateString(),
                'first_earned_at'      => $today->toDateString(),
            ]);
            $this->writeLog(
                $employid,
                $leaveType,
                'accrual',
                $before,
                $monthlyMinutes,
                $after,
                null,
                "Block B — First {$leaveType} earning",
                'system'
            );
        } else {
            EmployeeLeaveBalance::create([
                'employid'             => $employid,
                'leave_type'           => $leaveType,
                'balance_minutes'      => $monthlyMinutes,
                'monthly_rate_minutes' => $monthlyMinutes,
                'next_accrual_date'    => $nextAccrualDate->toDateString(),
                'next_yearly_date'     => $nextYearlyDate->toDateString(),
                'first_earned_at'      => $today->toDateString(),
            ]);
            $this->writeLog(
                $employid,
                $leaveType,
                'accrual',
                0,
                $monthlyMinutes,
                $monthlyMinutes,
                null,
                "Block B — First {$leaveType} earning",
                'system'
            );
        }

        Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Block B — first {$leaveType} earning ({$monthlyMinutes} min)");

        return true;
    }

    // =========================================================================
    // BLOCK C — MONTHLY VL / SIL ACCRUAL
    // Trigger: emp_status = 2 AND next_accrual_date <= today
    //
    // What it does:
    //   - Adds monthly_rate_minutes to balance_minutes (pure integer addition)
    //   - Advances next_accrual_date to the 1st of next month
    //   - Logs as 'accrual'
    //
    // Old system: VACATIONLEAVE += 7/12 (float drift)
    // New system: balance_minutes += 280 (exact integer, zero drift)
    // =========================================================================
    private function runBlockC(int $employid, array $work, Carbon $today): bool
    {
        Log::info("[BlockC] START", [
            'employid'   => $employid,
            'emp_status' => $work['emp_status'] ?? null,
            'today'      => $today->toDateString(),
        ]);

        // =========================
        // 1. Employee status check
        // =========================
        if ((int) $work['emp_status'] !== 2) {
            Log::info("[BlockC] SKIP - inactive employee", [
                'employid' => $employid,
                'emp_status' => $work['emp_status']
            ]);
            return false;
        }

        // =========================
        // 2. Determine leave type
        // =========================
        $isSpecialSIL = $this->isSpecialSILEmployee($employid, $work);
        $leaveType    = $isSpecialSIL ? 'SIL' : 'VL';

        Log::info("[BlockC] Leave type determined", [
            'employid'       => $employid,
            'is_special_sil'  => $isSpecialSIL,
            'leave_type'      => $leaveType
        ]);

        // =========================
        // 3. Fetch balance
        // =========================
        $balance = EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', $leaveType)
            ->whereNotNull('next_accrual_date')
            ->where('next_accrual_date', '<=', $today->toDateString())
            ->whereNotNull('first_earned_at')
            ->first();

        if (!$balance) {
            Log::warning("[BlockC] NO BALANCE FOUND", [
                'employid'  => $employid,
                'leaveType' => $leaveType,
                'today'     => $today->toDateString()
            ]);

            return false;
        }

        Log::info("[BlockC] BALANCE FOUND", [
            'employid'        => $employid,
            'leave_type'      => $leaveType,
            'balance_minutes' => $balance->balance_minutes,
            'monthly_rate'    => $balance->monthly_rate_minutes,
            'next_accrual'    => $balance->next_accrual_date
        ]);

        // =========================
        // 4. Compute accrual
        // =========================
        $before      = $balance->balance_minutes;
        $delta       = $balance->monthly_rate_minutes;
        $after       = $before + $delta;
        $nextAccrual = $today->copy()->addMonth()->startOfMonth();
        $monthLabel  = $today->copy()->subMonth()->format('F Y');

        Log::info("[BlockC] ACCRUAL CALCULATION", [
            'before'      => $before,
            'delta'       => $delta,
            'after'       => $after,
            'next_accrual' => $nextAccrual->toDateString()
        ]);

        // =========================
        // 5. Update balance
        // =========================
        $balance->update([
            'balance_minutes'   => $after,
            'next_accrual_date' => $nextAccrual->toDateString(),
        ]);

        Log::info("[BlockC] BALANCE UPDATED", [
            'employid' => $employid,
            'new_balance' => $after
        ]);

        // =========================
        // 6. Write system log
        // =========================
        $this->writeLog(
            $employid,
            $leaveType,
            'accrual',
            $before,
            $delta,
            $after,
            null,
            "Block C — {$monthLabel} Monthly {$leaveType} Accrual",
            'system'
        );

        Log::info("[LeaveAutoUpdate] SUCCESS Block C", [
            'employid' => $employid,
            'leave_type' => $leaveType,
            'added' => $delta,
            'final_balance' => $after
        ]);

        return true;
    }

    // =========================================================================
    // BLOCK D — YEARLY RESET (Jan 1)
    // Trigger: emp_status = 2 AND next_yearly_date <= today
    //
    // For VL / SIL:
    //   - Looks up new monthly_rate_minutes from vl_accrual_tier based on
    //     calendar years since DATEREG year (old: hardcoded formula)
    //   - Updates monthly_rate_minutes on the balance row
    //   - Does NOT change balance — Block C handles the next monthly credit
    //   - Advances next_yearly_date by 1 year
    //
    // For SL, BL, EL, Bereavement:
    //   - Resets balance_minutes to yearly_grant_minutes from leave_policy
    //   - Advances next_yearly_date by 1 year
    //   - Respects applies_to_hire_tier
    // =========================================================================
    private function runBlockD(int $employid, array $work, Carbon $today): bool
    {
        if ((int) $work['emp_status'] !== 2) {
            return false;
        }

        $fired        = false;
        $isSpecialSIL = $this->isSpecialSILEmployee($employid, $work);
        $isLegacy     = strtotime($work['date_hired']) <= strtotime(self::LEGACY_CUTOFF);
        $leaveType    = $isSpecialSIL ? 'SIL' : 'VL';

        // ── VL / SIL rate update ──────────────────────────────────────────────
        $vlBalance = EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', $leaveType)
            ->whereNotNull('next_yearly_date')
            ->where('next_yearly_date', '<=', $today->toDateString())
            ->first();

        if ($vlBalance) {
            $tier  = $this->getHireTier($work['date_hired']);
            $years = $today->year - Carbon::parse($work['date_reg'])->year;

            $newRate = $this->lookupAccrualRate($tier, $years);

            $nextYearly = Carbon::parse($vlBalance->next_yearly_date)->addYear();

            $vlBalance->update([
                'monthly_rate_minutes' => $newRate ?? $vlBalance->monthly_rate_minutes,
                'next_yearly_date'     => $nextYearly->toDateString(),
            ]);

            $this->writeLog(
                $employid,
                $leaveType,
                'yearly_reset',
                $vlBalance->balance_minutes,
                0,
                $vlBalance->balance_minutes,
                null,
                "Block D — {$leaveType} rate updated to {$newRate} min/month",
                'system'
            );

            Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Block D — {$leaveType} rate → {$newRate} min/month");
            $fired = true;
        }

        // ── Yearly leave resets (SL, BL, EL, Bereavement) ────────────────────
        $yearlyPolicies = LeavePolicy::whereIn('leave_type', ['SL', 'BL', 'EL', 'BEREAVEMENT'])
            ->where('is_active', 1)
            ->get()
            ->keyBy('leave_type');

        $yearlyBalances = EmployeeLeaveBalance::where('employid', $employid)
            ->whereIn('leave_type', $yearlyPolicies->keys()->toArray())
            ->whereNotNull('next_yearly_date')
            ->where('next_yearly_date', '<=', $today->toDateString())
            ->get()
            ->keyBy('leave_type');

        foreach ($yearlyBalances as $type => $balance) {
            $policy = $yearlyPolicies->get($type);
            if (!$policy) continue;

            // Tier restriction check
            if ($policy->applies_to_hire_tier === 'legacy' && !$isLegacy) continue;
            if ($policy->applies_to_hire_tier === 'new'    && $isLegacy)  continue;

            $before     = $balance->balance_minutes;
            $newBalance = (int) $policy->yearly_grant_minutes;
            $delta      = $newBalance - $before;
            $nextYearly = Carbon::parse($balance->next_yearly_date)->addYear();

            $balance->update([
                'balance_minutes'  => $newBalance,
                'next_yearly_date' => $nextYearly->toDateString(),
            ]);

            $this->writeLog(
                $employid,
                $type,
                'yearly_reset',
                $before,
                $delta,
                $newBalance,
                null,
                "Block D — {$type} yearly reset ({$today->year})",
                'system'
            );

            Log::info("[LeaveAutoUpdate] EMPLOYID {$employid}: Block D — {$type} reset to {$newBalance} min");
            $fired = true;
        }

        return $fired;
    }

    // =========================================================================
    // BLOCK E — YEAR-END VL PROCESSING
    // Trigger: year_end_config row where run_date <= today AND status = pending
    //
    // What it does (per employee per year_end_config):
    //   1. Read VL balance_before
    //   2. carryover = min(balance_before, max_carryover_days × 480)
    //   3. excess    = balance_before - carryover
    //   4. converted = min(excess, max_convertible_days × 480)
    //   5. forfeited = excess - converted
    //   6. cash      = (converted / 480) × cash_rate_per_day
    //   7. Set new balance = carryover
    //   8. Write year_end_conversion_log row
    //   9. Write leave_accrual_log rows (carryover, converted, forfeited)
    //  10. Mark year_end_config.status = completed, ran_at = now()
    // =========================================================================
    public function runBlockE(Carbon $today): bool
    {
        $configs = YearEndConfig::where('status', 'pending')
            ->where('run_date', '<=', $today->toDateString())
            ->get();

        if ($configs->isEmpty()) {
            return false;
        }

        foreach ($configs as $config) {
            $this->processYearEnd($config);
        }

        return true;
    }

    private function processYearEnd(YearEndConfig $config): void
    {
        Log::info("[LeaveAutoUpdate] Block E — Year-end {$config->year} starting");

        $maxCarryoverMin   = $config->max_carryover_days   * 480;
        $maxConvertibleMin = $config->max_convertible_days * 480;
        $cashRate          = (float) $config->cash_rate_per_day;

        $vlBalances = EmployeeLeaveBalance::where('leave_type', 'VL')->get();

        foreach ($vlBalances as $balance) {
            DB::transaction(function () use ($balance, $config, $maxCarryoverMin, $maxConvertibleMin, $cashRate) {
                $before    = $balance->balance_minutes;
                $carryover = min($before, $maxCarryoverMin);
                $excess    = $before - $carryover;
                $converted = min($excess, $maxConvertibleMin);
                $forfeited = $excess - $converted;
                $cash      = $converted > 0 ? round(($converted / 480) * $cashRate, 2) : 0.00;

                // Update balance to carryover amount
                $balance->update(['balance_minutes' => $carryover]);

                // Log carryover
                if ($carryover > 0) {
                    $this->writeLog(
                        $balance->employid,
                        'VL',
                        'carryover',
                        $before,
                        $carryover - $before,
                        $carryover,
                        null,
                        "Year-end {$config->year} — VL carryover ({$config->max_carryover_days}d cap)",
                        'system'
                    );
                }

                // Log converted
                if ($converted > 0) {
                    $this->writeLog(
                        $balance->employid,
                        'VL',
                        'converted',
                        $carryover,
                        -$converted,
                        $carryover - $converted,
                        null,
                        "Year-end {$config->year} — {$converted} min converted to ₱{$cash} cash",
                        'system'
                    );
                }

                // Log forfeited
                if ($forfeited > 0) {
                    $this->writeLog(
                        $balance->employid,
                        'VL',
                        'forfeited',
                        $carryover,
                        -$forfeited,
                        $carryover - $forfeited,
                        null,
                        "Year-end {$config->year} — {$forfeited} min forfeited",
                        'system'
                    );
                }

                // Write conversion log row
                YearEndConversionLog::create([
                    'year_end_config_id'     => $config->id,
                    'employid'               => $balance->employid,
                    'balance_before_minutes' => $before,
                    'carryover_minutes'      => $carryover,
                    'converted_minutes'      => $converted,
                    'forfeited_minutes'      => $forfeited,
                    'cash_amount'            => $cash,
                ]);
            });
        }

        $config->update([
            'status' => 'completed',
            'ran_at' => now(),
        ]);

        Log::info("[LeaveAutoUpdate] Block E — Year-end {$config->year} completed");
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private function isSpecialSILEmployee(int $employid, array $work): bool
    {
        return str_contains($work['prod_line'] ?? '', self::SIL_PRODLINE)
            && str_starts_with((string) $employid, self::SIL_ID_PREFIX)
            && (int) $work['acc_status'] === 1;
    }

    private function getHireTier(string $dateHired): string
    {
        return strtotime($dateHired) <= strtotime(self::LEGACY_CUTOFF) ? 'legacy' : 'new';
    }

    /**
     * Look up the monthly accrual rate from vl_accrual_tier.
     * $years = calendar year difference since regularization year.
     */
    private function lookupAccrualRate(string $tier, int $years): ?int
    {
        $row = VlAccrualTier::where('tier', $tier)
            ->where('year_from', '<=', $years)
            ->where(function ($q) use ($years) {
                $q->whereNull('year_to')
                    ->orWhere('year_to', '>=', $years);
            })
            ->orderByDesc('year_from')
            ->first();

        return $row ? (int) $row->monthly_minutes : null;
    }

    private function writeLog(
        int $employid,
        string $leaveType,
        string $actionType,
        int $before,
        int $delta,
        int $after,
        ?int $requestId,
        string $remarks,
        string $triggeredBy
    ): void {
        LeaveAccrualLog::create([
            'employid'         => $employid,
            'leave_type'       => $leaveType,
            'action_type'      => $actionType,
            'minutes_before'   => $before,
            'minutes_delta'    => $delta,
            'minutes_after'    => $after,
            'leave_request_id' => $requestId,
            'remarks'          => $remarks,
            'triggered_by'     => $triggeredBy,
        ]);
    }

    private function setSystemStatus(string $status, string $message): void
    {
        SystemStatus::query()->update([
            'status'     => $status,
            'message'    => $message,
            'updated_at' => now(),
        ]);
    }
}
