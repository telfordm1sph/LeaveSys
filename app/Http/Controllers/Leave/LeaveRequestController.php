<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Services\LeaveRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function __construct(
        protected LeaveRequestService $service
    ) {}

    public function index(Request $request): Response
    {
        [$employid, $tab, $search, $page] = $this->parseParams($request);

        return Inertia::render('Leave/Requests', [
            'myRequests' => $this->service->getMyRequests($employid, $tab, $search, $page, false),
            'tab'        => $tab,
            'search'     => $search,
        ]);
    }

    public function appeals(Request $request): Response
    {
        [$employid, $tab, $search, $page] = $this->parseParams($request);

        return Inertia::render('Leave/Appeals', [
            'myRequests' => $this->service->getMyRequests($employid, $tab, $search, $page, true),
            'tab'        => $tab,
            'search'     => $search,
        ]);
    }

    public function staffRequests(Request $request): Response
    {
        [$employid, $tab, , $page] = $this->parseParams($request);

        return Inertia::render('Leave/StaffRequests', [
            'pending' => $tab === 'pending' ? $this->service->getPendingApprovals($employid, false) : [],
            'history' => $tab === 'history' ? $this->service->getStaffHistory($employid, false, $page) : null,
            'tab'     => $tab,
        ]);
    }

    public function staffAppeals(Request $request): Response
    {
        [$employid, $tab, , $page] = $this->parseParams($request);

        return Inertia::render('Leave/StaffAppeals', [
            'pending' => $tab === 'pending' ? $this->service->getPendingApprovals($employid, true) : [],
            'history' => $tab === 'history' ? $this->service->getStaffHistory($employid, true, $page) : null,
            'tab'     => $tab,
        ]);
    }

    private function parseParams(Request $request): array
    {
        return [
            (int)    session('emp_data.emp_id'),
            in_array($request->query('tab'), ['pending', 'history']) ? $request->query('tab') : 'pending',
            (string) $request->query('search', ''),
            max(1, (int) $request->query('page', 1)),
        ];
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $result = $this->service->approve(
            (int) session('emp_data.emp_id'),
            $id,
            $request->input('remarks'),
        );

        if ($result['status'] === 'error') {
            return back()->withErrors(['approval' => $result['message']]);
        }

        return back()->with('success', 'Leave request approved.');
    }

    public function reject(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $result = $this->service->reject(
            (int) session('emp_data.emp_id'),
            $id,
            $validated['remarks'],
        );

        if ($result['status'] === 'error') {
            return back()->withErrors(['approval' => $result['message']]);
        }

        return back()->with('success', 'Leave request rejected.');
    }
}
