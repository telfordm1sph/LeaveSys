<?php

namespace App\Repositories\Admin;

use App\Models\LeavePolicy;
use Illuminate\Support\Collection;

class LeavePolicyRepository
{
    public function all(): Collection
    {
        return LeavePolicy::orderBy('id')->get();
    }

    public function find(int $id): LeavePolicy
    {
        return LeavePolicy::findOrFail($id);
    }

    public function create(array $data): LeavePolicy
    {
        return LeavePolicy::create($data);
    }

    public function update(LeavePolicy $policy, array $data): void
    {
        $policy->update($data);
    }
}
