<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\EmployeeBalanceService;
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
        $employid = $request->query('employid') ? (int) $request->query('employid') : null;
        $data     = $employid ? $this->service->getForEmployee($employid) : null;

        return Inertia::render('Admin/EmployeeBalance/Index', [
            'employid' => $employid,
            'employee' => $data,
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
