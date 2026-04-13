<?php

namespace App\Repositories\Admin;

use App\Models\YearEndConfig;
use App\Models\YearEndConversionLog;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class YearEndConfigRepository
{
    public function all(): Collection
    {
        return YearEndConfig::orderByDesc('year')->get();
    }

    public function find(int $id): YearEndConfig
    {
        return YearEndConfig::findOrFail($id);
    }

    public function create(array $data): YearEndConfig
    {
        return YearEndConfig::create($data);
    }

    public function update(YearEndConfig $config, array $data): void
    {
        $config->update($data);
    }

    public function conversionLogs(int $configId, int $perPage = 25): LengthAwarePaginator
    {
        return YearEndConversionLog::where('year_end_config_id', $configId)
            ->orderBy('employid')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function yearExists(int $year, ?int $excludeId = null): bool
    {
        $query = YearEndConfig::where('year', $year);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->exists();
    }
}
