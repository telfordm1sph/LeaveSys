<?php

namespace App\Services\Admin;

use App\Models\VlAccrualTier;
use App\Repositories\Admin\VlAccrualTierRepository;
use Illuminate\Support\Collection;

class VlAccrualTierService
{
    public function __construct(
        protected VlAccrualTierRepository $repo
    ) {}

    public function all(): Collection
    {
        return $this->repo->all();
    }

    public function create(array $data): VlAccrualTier
    {
        return $this->repo->create([
            'tier'             => $data['tier'],
            'year_from'        => (int) $data['year_from'],
            'year_to'          => isset($data['year_to']) && $data['year_to'] !== '' ? (int) $data['year_to'] : null,
            'monthly_minutes'  => (int) $data['monthly_minutes'],
        ]);
    }

    public function update(int $id, array $data): void
    {
        $tier = $this->repo->find($id);
        $this->repo->update($tier, [
            'tier'            => $data['tier'],
            'year_from'       => (int) $data['year_from'],
            'year_to'         => isset($data['year_to']) && $data['year_to'] !== '' ? (int) $data['year_to'] : null,
            'monthly_minutes' => (int) $data['monthly_minutes'],
        ]);
    }

    public function delete(int $id): void
    {
        $tier = $this->repo->find($id);
        $this->repo->delete($tier);
    }
}
