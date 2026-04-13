<?php

namespace App\Services\Admin;

use App\Models\LeavePolicy;
use App\Repositories\Admin\LeavePolicyRepository;
use Illuminate\Support\Collection;

class LeavePolicyService
{
    public function __construct(
        protected LeavePolicyRepository $repo
    ) {}

    public function all(): Collection
    {
        return $this->repo->all();
    }

    public function create(array $data): LeavePolicy
    {
        return $this->repo->create([
            'leave_type'           => strtoupper(trim($data['leave_type'])),
            'label'                => $data['label'],
            'earn_type'            => $data['earn_type'],
            'yearly_grant_minutes' => $data['yearly_grant_minutes'] ?? null,
            'applies_to_hire_tier' => $data['applies_to_hire_tier'],
            'is_convertible'       => (bool) ($data['is_convertible'] ?? false),
            'max_carryover_days'   => (int) ($data['max_carryover_days'] ?? 0),
            'max_convertible_days' => (int) ($data['max_convertible_days'] ?? 0),
            'cash_rate_per_day'    => (float) ($data['cash_rate_per_day'] ?? 0),
            'is_active'            => true,
        ]);
    }

    public function update(int $id, array $data): void
    {
        $policy = $this->repo->find($id);
        $this->repo->update($policy, [
            'label'                => $data['label'],
            'earn_type'            => $data['earn_type'],
            'yearly_grant_minutes' => $data['yearly_grant_minutes'] ?? null,
            'applies_to_hire_tier' => $data['applies_to_hire_tier'],
            'is_convertible'       => (bool) ($data['is_convertible'] ?? false),
            'max_carryover_days'   => (int) ($data['max_carryover_days'] ?? 0),
            'max_convertible_days' => (int) ($data['max_convertible_days'] ?? 0),
            'cash_rate_per_day'    => (float) ($data['cash_rate_per_day'] ?? 0),
        ]);
    }

    public function toggleActive(int $id): void
    {
        $policy = $this->repo->find($id);
        $this->repo->update($policy, ['is_active' => !$policy->is_active]);
    }
}
