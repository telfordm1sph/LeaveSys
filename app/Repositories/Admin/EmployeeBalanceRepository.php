<?php

namespace App\Repositories\Admin;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EmployeeBalanceRepository
{
    public function getBalances(int $employid): Collection
    {
        return EmployeeLeaveBalance::query()
            ->join('leave_policy', 'employee_leave_balance.leave_type', '=', 'leave_policy.leave_type')
            ->where('employee_leave_balance.employid', $employid)
            ->select([
                'employee_leave_balance.*',
                'leave_policy.label',
                'leave_policy.earn_type',
                'leave_policy.is_convertible',
            ])
            ->orderBy('leave_policy.id')
            ->get();
    }

    public function getLogs(int $employid, int $perPage = 10, ?string $leaveType = null, ?string $search = null): \Illuminate\Pagination\LengthAwarePaginator
    {
        return LeaveAccrualLog::where('employid', $employid)
            ->when($leaveType, fn($q) => $q->where('leave_type', $leaveType))
            ->when($search, fn($q) => $q->where(function ($q2) use ($search) {
                $q2->where('remarks', 'like', "%{$search}%")
                   ->orWhere('action_type', 'like', "%{$search}%");
            }))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getLeaveTypesForEmployee(int $employid): array
    {
        return LeaveAccrualLog::where('employid', $employid)
            ->distinct()
            ->orderBy('leave_type')
            ->pluck('leave_type')
            ->toArray();
    }

    public function getBalance(int $employid, string $leaveType): ?EmployeeLeaveBalance
    {
        return EmployeeLeaveBalance::where('employid', $employid)
            ->where('leave_type', $leaveType)
            ->first();
    }

    public function applyAdjustment(
        EmployeeLeaveBalance $balance,
        int $minutesDelta,
        string $remarks,
        int $adminId
    ): void {
        $before = $balance->balance_minutes;
        $after  = $before + $minutesDelta;

        $balance->balance_minutes = $after;
        $balance->save();

        LeaveAccrualLog::create([
            'employid'         => $balance->employid,
            'leave_type'       => $balance->leave_type,
            'action_type'      => 'manual_adj',
            'minutes_before'   => $before,
            'minutes_delta'    => $minutesDelta,
            'minutes_after'    => $after,
            'leave_request_id' => null,
            'remarks'          => $remarks,
            'triggered_by'     => 'admin',
        ]);
    }
}
