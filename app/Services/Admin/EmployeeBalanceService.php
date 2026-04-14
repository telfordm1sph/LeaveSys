<?php

namespace App\Services\Admin;

use App\Repositories\Admin\EmployeeBalanceRepository;
use App\Services\HrisApiService;
use Illuminate\Support\Collection;

class EmployeeBalanceService
{
    public function __construct(
        protected EmployeeBalanceRepository $repo,
        protected HrisApiService $hris,
    ) {}

    public function getForEmployee(int $employid): array
    {
        $name     = $this->hris->fetchEmployeeName($employid);
        $balances = $this->repo->getBalances($employid);

        return [
            'employid' => $employid,
            'name'     => $name,
            'balances' => $balances,
        ];
    }

    public function getLogsPage(int $employid, ?string $leaveType, ?string $search = null): array
    {
        $name       = $this->hris->fetchEmployeeName($employid);
        $logs       = $this->repo->getLogs($employid, 10, $leaveType ?: null, $search ?: null);
        $leaveTypes = $this->repo->getLeaveTypesForEmployee($employid);

        return compact('name', 'logs', 'leaveTypes');
    }

    public function getEmployeesForCombobox(string $search, int $page): array
    {
        $result  = $this->hris->fetchActiveEmployees($search, $page, 50);
        $options = collect($result['data'])
            ->filter(fn($e) => !empty($e['employid']))
            ->map(fn($e) => [
                'value' => (int) $e['employid'],
                'label' => $e['employid'] . ' - ' . ($e['emp_name'] ?? 'Unknown'),
            ])
            ->values()
            ->all();

        return ['options' => $options, 'hasMore' => $result['hasMore']];
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
