<?php

namespace App\Repositories;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualLog;
use Illuminate\Support\Collection;

class LeaveBalanceRepository
{
    /**
     * Get all leave balances for a given employee, joined with policy labels.
     * Only returns rows for active leave policies.
     */
    public function getByEmployee(int $employid): Collection
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
                'leave_policy.is_convertible',
                'leave_policy.yearly_grant_minutes',
                'employee_leave_balance.balance_minutes',
                'employee_leave_balance.monthly_rate_minutes',
                'employee_leave_balance.next_accrual_date',
                'employee_leave_balance.next_yearly_date',
                'employee_leave_balance.first_earned_at',
                'employee_leave_balance.updated_at',
            ])
            ->orderBy('leave_policy.id')
            ->get();
    }

    public function getLogs(int $employid, int $perPage = 30, ?string $leaveType = null): \Illuminate\Pagination\LengthAwarePaginator
    {
        return LeaveAccrualLog::where('employid', $employid)
            ->when($leaveType, fn($q) => $q->where('leave_type', $leaveType))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getLeaveTypes(int $employid): array
    {
        return LeaveAccrualLog::where('employid', $employid)
            ->distinct()
            ->orderBy('leave_type')
            ->pluck('leave_type')
            ->toArray();
    }
}
