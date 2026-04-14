<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\EmployeeBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeBalanceController extends Controller
{
    public function __construct(
        protected EmployeeBalanceService $service
    ) {}

    public function index(Request $request): Response
    {
        $employid = $request->query('employid')
            ? (int) $request->query('employid')
            : (int) session('emp_data.emp_id');

        $data = $employid ? $this->service->getForEmployee($employid) : null;

        return Inertia::render('Admin/EmployeeBalance/Index', [
            'employid' => $employid,
            'employee' => $data,
        ]);
    }

    public function employees(Request $request): JsonResponse
    {
        $search = (string) ($request->query('search') ?? '');
        $page   = max(1, (int) ($request->query('page') ?? 1));
        $result = $this->service->getEmployeesForCombobox($search, $page);
        return response()->json($result);
    }

    public function logs(Request $request, int $employid): Response
    {
        $data = $this->service->getLogsPage(
            $employid,
            $request->query('leave_type'),
            $request->query('search'),
        );

        return Inertia::render('Admin/EmployeeBalance/Logs', [
            'employid'   => $employid,
            'name'       => $data['name'],
            'logs'       => $data['logs'],
            'leaveTypes' => $data['leaveTypes'],
            'filterType' => $request->query('leave_type', ''),
            'search'     => $request->query('search', ''),
        ]);
    }

    public function adjust(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employid'      => 'required|integer',
            'leave_type'    => 'required|string|max:20',
            'minutes_delta' => 'required|integer|not_in:0',
            'remarks'       => 'required|string|max:255',
        ]);

        $adminId = (int) session('emp_data.emp_id');
        $result  = $this->service->adjust($adminId, $validated);

        if ($result['status'] === 'error') {
            return back()->withErrors(['general' => $result['message']]);
        }

        return back()->with('success', 'Balance adjusted successfully.');
    }
}
