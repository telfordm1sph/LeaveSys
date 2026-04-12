<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeavePolicy extends Model
{
    protected $connection = 'mysql';
    protected $table = 'leave_policy';

    protected $fillable = [
        'leave_type',
        'label',
        'earn_type',
        'yearly_grant_minutes',
        'applies_to_hire_tier',
        'is_convertible',
        'max_carryover_days',
        'max_convertible_days',
        'cash_rate_per_day',
        'is_active',
    ];

    protected $casts = [
        'yearly_grant_minutes'  => 'integer',
        'is_convertible'        => 'boolean',
        'max_carryover_days'    => 'integer',
        'max_convertible_days'  => 'integer',
        'cash_rate_per_day'     => 'decimal:2',
        'is_active'             => 'boolean',
    ];

    public function balances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class, 'leave_type', 'leave_type');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'leave_type', 'leave_type');
    }
}
