<?php

namespace App\Services\Admin;

use App\Models\Holiday;
use App\Repositories\Admin\HolidayRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class HolidayService
{
    public function __construct(
        protected HolidayRepository $repo
    ) {}

    public function paginate(int $year, int $perPage = 20): LengthAwarePaginator
    {
        return $this->repo->paginate($year, $perPage);
    }

    public function availableYears(): array
    {
        return $this->repo->availableYears();
    }

    public function create(array $data): Holiday
    {
        return $this->repo->create([
            'holiday_date' => $data['holiday_date'],
            'name'         => $data['name'],
            'type'         => $data['type'],
            'is_paid'      => (bool) ($data['is_paid'] ?? true),
        ]);
    }

    public function update(int $id, array $data): void
    {
        $holiday = $this->repo->find($id);
        $this->repo->update($holiday, [
            'holiday_date' => $data['holiday_date'],
            'name'         => $data['name'],
            'type'         => $data['type'],
            'is_paid'      => (bool) ($data['is_paid'] ?? true),
        ]);
    }

    public function delete(int $id): void
    {
        $holiday = $this->repo->find($id);
        $this->repo->delete($holiday);
    }
}
