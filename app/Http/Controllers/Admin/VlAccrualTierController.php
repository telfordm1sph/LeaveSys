<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\VlAccrualTierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VlAccrualTierController extends Controller
{
    public function __construct(
        protected VlAccrualTierService $service
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/VlAccrualTier/Index', [
            'tiers' => $this->service->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tier'            => 'required|in:new,legacy',
            'year_from'       => 'required|integer|min:0',
            'year_to'         => 'nullable|integer|min:0',
            'monthly_minutes' => 'required|integer|min:1',
        ]);

        $this->service->create($validated);

        return back()->with('success', 'Accrual tier created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'tier'            => 'required|in:new,legacy',
            'year_from'       => 'required|integer|min:0',
            'year_to'         => 'nullable|integer|min:0',
            'monthly_minutes' => 'required|integer|min:1',
        ]);

        $this->service->update($id, $validated);

        return back()->with('success', 'Accrual tier updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return back()->with('success', 'Accrual tier deleted.');
    }
}
