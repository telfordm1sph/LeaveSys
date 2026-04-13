<?php

namespace App\Repositories\Admin;

use App\Models\Holiday;
use Illuminate\Pagination\LengthAwarePaginator;

class HolidayRepository
{
    public function paginate(int $year, int $perPage = 20): LengthAwarePaginator
    {
        return Holiday::whereYear('holiday_date', $year)
            ->orderBy('holiday_date')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function find(int $id): Holiday
    {
        return Holiday::findOrFail($id);
    }

    public function create(array $data): Holiday
    {
        return Holiday::create($data);
    }

    public function update(Holiday $holiday, array $data): void
    {
        $holiday->update($data);
    }

    public function delete(Holiday $holiday): void
    {
        $holiday->delete();
    }

    public function availableYears(): array
    {
        return Holiday::selectRaw('YEAR(holiday_date) as year')
            ->groupBy('year')
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();
    }
}
