<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\HolidayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function __construct(
        protected HolidayService $service
    ) {}

    public function index(Request $request): Response
    {
        $year = (int) ($request->query('year') ?? now()->year);

        return Inertia::render('Admin/Holiday/Index', [
            'holidays'        => $this->service->paginate($year),
            'year'            => $year,
            'available_years' => $this->service->availableYears(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'holiday_date' => 'required|date|unique:mysql.holidays,holiday_date',
            'name'         => 'required|string|max:100',
            'type'         => 'required|in:regular,special,company',
            'is_paid'      => 'boolean',
        ]);

        $this->service->create($validated);

        return back()->with('success', 'Holiday added.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'holiday_date' => "required|date|unique:mysql.holidays,holiday_date,{$id}",
            'name'         => 'required|string|max:100',
            'type'         => 'required|in:regular,special,company',
            'is_paid'      => 'boolean',
        ]);

        $this->service->update($id, $validated);

        return back()->with('success', 'Holiday updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return back()->with('success', 'Holiday deleted.');
    }
}
