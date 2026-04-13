<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\LeavePolicyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeavePolicyController extends Controller
{
    public function __construct(
        protected LeavePolicyService $service
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/LeavePolicy/Index', [
            'policies' => $this->service->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type'           => 'required|string|max:20|unique:mysql.leave_policy,leave_type',
            'label'                => 'required|string|max:100',
            'earn_type'            => 'required|in:monthly,yearly,event',
            'yearly_grant_minutes' => 'nullable|integer|min:0',
            'applies_to_hire_tier' => 'required|in:all,new,legacy',
            'is_convertible'       => 'boolean',
            'max_carryover_days'   => 'integer|min:0',
            'max_convertible_days' => 'integer|min:0',
            'cash_rate_per_day'    => 'numeric|min:0',
        ]);

        $this->service->create($validated);

        return back()->with('success', 'Leave policy created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'label'                => 'required|string|max:100',
            'earn_type'            => 'required|in:monthly,yearly,event',
            'yearly_grant_minutes' => 'nullable|integer|min:0',
            'applies_to_hire_tier' => 'required|in:all,new,legacy',
            'is_convertible'       => 'boolean',
            'max_carryover_days'   => 'integer|min:0',
            'max_convertible_days' => 'integer|min:0',
            'cash_rate_per_day'    => 'numeric|min:0',
        ]);

        $this->service->update($id, $validated);

        return back()->with('success', 'Leave policy updated.');
    }

    public function toggleActive(int $id): RedirectResponse
    {
        $this->service->toggleActive($id);

        return back()->with('success', 'Leave policy status toggled.');
    }
}
