<?php

namespace App\Repositories;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualLog;
use App\Models\LeaveApprover;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeaveFilingRepository
{
    /**
     * Active balances for an employee, joined with policy.
     */
    public function getBalances(int $employid): Collection
    {
        return EmployeeLeaveBalance::query()
            ->join('leave_policy', 'employee_leave_balance.leave_type', '=', 'leave_policy.leave_type')
            ->where('employee_leave_balance.employid', $employid)
            ->where('leave_policy.is_active', 1)
            ->select([
                'employee_leave_balance.id',
                'employee_leave_balance.leave_type',
                'leave_policy.label',
                'leave_policy.earn_type',
                'leave_policy.applies_to_hire_tier',
                'employee_leave_balance.balance_minutes',
            ])
            ->orderBy('leave_policy.id')
            ->get();
    }

    /**
     * Holiday dates in a given range (inclusive).
     */
    public function getHolidaysInRange(Carbon $start, Carbon $end): Collection
    {
        return DB::connection('mysql')
            ->table('holidays')
            ->whereBetween('holiday_date', [$start->toDateString(), $end->toDateString()])
            ->pluck('holiday_date');
    }

    /**
     * All holidays for date-picker awareness (current + next year).
     */
    public function getUpcomingHolidays(): Collection
    {
        return DB::connection('mysql')
            ->table('holidays')
            ->where('holiday_date', '>=', Carbon::now()->startOfYear()->toDateString())
            ->where('holiday_date', '<=', Carbon::now()->addYear()->endOfYear()->toDateString())
            ->select(['holiday_date', 'name', 'type'])
            ->orderBy('holiday_date')
            ->get();
    }

    /**
     * Get a single balance row for one employee + leave type.
     */
    public function getBalance(int $employid, string $leaveType): ?EmployeeLeaveBalance
    {
        return EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', $leaveType)
            ->first();
    }

    /**
     * Insert a new leave request. Returns the created model.
     */
    public function createRequest(array $data): LeaveRequest
    {
        return LeaveRequest::create($data);
    }

    /**
     * Insert an approver row for a leave request.
     */
    public function createApprover(array $data): void
    {
        LeaveApprover::create($data);
    }

    /**
     * Refund the deducted balance when a leave is rejected, and log it.
     */
    public function refundBalance(LeaveRequest $request): void
    {
        $balance = EmployeeLeaveBalance::where('employid', $request->employid)
            ->where('leave_type', $request->leave_type)
            ->first();

        if (!$balance) return;

        $before = $balance->balance_minutes;
        $after  = $before + $request->deduction_minutes;

        $balance->balance_minutes = $after;
        $balance->save();

        LeaveAccrualLog::create([
            'employid'         => $request->employid,
            'leave_type'       => $request->leave_type,
            'action_type'      => 'adjustment',
            'minutes_before'   => $before,
            'minutes_delta'    => $request->deduction_minutes,
            'minutes_after'    => $after,
            'leave_request_id' => $request->id,
            'remarks'          => "Leave #{$request->id} rejected — balance refunded",
            'triggered_by'     => 'system',
        ]);
    }

    /**
     * Update an existing leave request by ID.
     */
    public function updateRequest(int $id, array $data): void
    {
        LeaveRequest::where('id', $id)->update($data);
    }

    /**
     * Deduct balance_minutes and write an immutable audit log row.
     * Caller must pass the balance row (locked for update).
     */
    public function deductBalance(
        EmployeeLeaveBalance $balance,
        int $deductMinutes,
        int $requestId,
        string $remarks
    ): void {
        $before = $balance->balance_minutes;
        $after  = $before - $deductMinutes;

        $balance->balance_minutes = $after;
        $balance->save();

        LeaveAccrualLog::create([
            'employid'         => $balance->employid,
            'leave_type'       => $balance->leave_type,
            'action_type'      => 'used',
            'minutes_before'   => $before,
            'minutes_delta'    => -$deductMinutes,
            'minutes_after'    => $after,
            'leave_request_id' => $requestId,
            'remarks'          => $remarks,
            'triggered_by'     => 'employee',
        ]);
    }
}
