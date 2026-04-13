<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\YearEndConfigService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class YearEndConfigController extends Controller
{
    public function __construct(
        protected YearEndConfigService $service
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/YearEndConfig/Index', [
            'configs' => $this->service->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year'                 => 'required|integer|min:2000|max:2100',
            'run_date'             => 'required|date',
            'max_carryover_days'   => 'required|integer|min:0',
            'max_convertible_days' => 'required|integer|min:0',
            'cash_rate_per_day'    => 'required|numeric|min:0',
        ]);

        $result = $this->service->create($validated);

        if ($result['status'] === 'error') {
            return back()->withErrors(['year' => $result['message']]);
        }

        return back()->with('success', "Year-end config for {$validated['year']} created.");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'run_date'             => 'required|date',
            'max_carryover_days'   => 'required|integer|min:0',
            'max_convertible_days' => 'required|integer|min:0',
            'cash_rate_per_day'    => 'required|numeric|min:0',
        ]);

        $result = $this->service->update($id, $validated);

        if ($result['status'] === 'error') {
            return back()->withErrors(['general' => $result['message']]);
        }

        return back()->with('success', 'Year-end config updated.');
    }

    public function logs(Request $request, int $id): Response
    {
        $config = $this->service->find($id);
        $logs   = $this->service->conversionLogs($id);

        return Inertia::render('Admin/YearEndConfig/Logs', [
            'config' => $config,
            'logs'   => $logs,
        ]);
    }
}
