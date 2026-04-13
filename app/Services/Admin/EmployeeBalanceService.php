<?php

namespace App\Services\Admin;

use App\Repositories\Admin\EmployeeBalanceRepository;
use Illuminate\Support\Collection;

class EmployeeBalanceService
{
    public function __construct(
        protected EmployeeBalanceRepository $repo
    ) {}

    public function getForEmployee(int $employid): array
    {
        // $name     = $this->repo->getEmployeeName($employid);
        $balances = $this->repo->getBalances($employid);
        $logs     = $this->repo->getLogs($employid);

        return [
            'employid' => $employid,
            // 'name'     => $name,
            'balances' => $balances,
            'logs'     => $logs,
        ];
    }

    public function adjust(int $adminId, array $data): array
    {
        $employid   = (int) $data['employid'];
        $leaveType  = strtoupper($data['leave_type']);
        $delta      = (int) $data['minutes_delta'];
        $remarks    = trim($data['remarks']);

        if ($delta === 0) {
            return ['status' => 'error', 'message' => 'Adjustment amount cannot be zero.'];
        }

        $balance = $this->repo->getBalance($employid, $leaveType);

        if (!$balance) {
            return ['status' => 'error', 'message' => "No balance record for {$leaveType} for employee {$employid}."];
        }

        $this->repo->applyAdjustment($balance, $delta, $remarks, $adminId);

        return ['status' => 'ok'];
    }
}
