<?php

namespace App\Services\Admin;

use App\Models\YearEndConfig;
use App\Repositories\Admin\YearEndConfigRepository;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class YearEndConfigService
{
    public function __construct(
        protected YearEndConfigRepository $repo
    ) {}

    public function all(): Collection
    {
        return $this->repo->all();
    }

    public function create(array $data): array
    {
        if ($this->repo->yearExists((int) $data['year'])) {
            return ['status' => 'error', 'message' => "A configuration for year {$data['year']} already exists."];
        }

        $config = $this->repo->create([
            'year'                 => (int) $data['year'],
            'run_date'             => $data['run_date'],
            'max_carryover_days'   => (int) ($data['max_carryover_days'] ?? 0),
            'max_convertible_days' => (int) ($data['max_convertible_days'] ?? 0),
            'cash_rate_per_day'    => (float) ($data['cash_rate_per_day'] ?? 0),
            'status'               => 'pending',
        ]);

        return ['status' => 'ok', 'config' => $config];
    }

    public function update(int $id, array $data): array
    {
        $config = $this->repo->find($id);

        if ($config->status === 'completed') {
            return ['status' => 'error', 'message' => 'Cannot edit a completed year-end config.'];
        }

        $this->repo->update($config, [
            'run_date'             => $data['run_date'],
            'max_carryover_days'   => (int) ($data['max_carryover_days'] ?? 0),
            'max_convertible_days' => (int) ($data['max_convertible_days'] ?? 0),
            'cash_rate_per_day'    => (float) ($data['cash_rate_per_day'] ?? 0),
        ]);

        return ['status' => 'ok'];
    }

    public function conversionLogs(int $id, int $perPage = 25): LengthAwarePaginator
    {
        return $this->repo->conversionLogs($id, $perPage);
    }

    public function find(int $id): YearEndConfig
    {
        return $this->repo->find($id);
    }
}
