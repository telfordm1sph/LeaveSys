<?php

namespace App\Repositories\Admin;

use App\Models\VlAccrualTier;
use Illuminate\Support\Collection;

class VlAccrualTierRepository
{
    public function all(): Collection
    {
        return VlAccrualTier::orderBy('tier')->orderBy('year_from')->get();
    }

    public function find(int $id): VlAccrualTier
    {
        return VlAccrualTier::findOrFail($id);
    }

    public function create(array $data): VlAccrualTier
    {
        return VlAccrualTier::create($data);
    }

    public function update(VlAccrualTier $tier, array $data): void
    {
        $tier->update($data);
    }

    public function delete(VlAccrualTier $tier): void
    {
        $tier->delete();
    }
}
