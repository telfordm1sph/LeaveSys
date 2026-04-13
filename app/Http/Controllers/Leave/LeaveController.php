<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Services\LeaveBalanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function __construct(
        protected LeaveBalanceService $leaveBalanceService
    ) {}

    public function balances(Request $request): Response
    {
        $employid = (int) session('emp_data.emp_id');

        $balances = $this->leaveBalanceService->getBalances($employid);
        $logs     = $this->leaveBalanceService->getLogs($employid, $request->query('leave_type'));

        return Inertia::render('Leave/Balances', [
            'balances'   => $balances->values(),
            'logs'       => $logs,
            'leaveTypes' => $this->leaveBalanceService->getLeaveTypes($employid),
            'filterType' => $request->query('leave_type', ''),
        ]);
    }
}
