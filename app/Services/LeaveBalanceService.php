<?php

namespace App\Services;

use App\Repositories\LeaveBalanceRepository;
use Illuminate\Support\Collection;

class LeaveBalanceService
{
    public function __construct(
        protected LeaveBalanceRepository $repo
    ) {}

    /**
     * Return leave balances for the given employee.
     * display_balance = floor(balance_minutes / 480) — shown as "Balance" to the user.
     * 1 Balance = 8 hours = 480 minutes.
     */
    public function getBalances(int $employid): Collection
    {
        return $this->repo->getByEmployee($employid);
    }

    public function getLogs(int $employid, ?string $leaveType = null): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->repo->getLogs($employid, 30, $leaveType ?: null);
    }

    public function getLeaveTypes(int $employid): array
    {
        return $this->repo->getLeaveTypes($employid);
    }
}
