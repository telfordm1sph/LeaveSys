<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveBalance extends Model
{
    protected $connection = 'mysql';
    protected $table = 'employee_leave_balance';
    public $timestamps = false;

    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'employid',
        'leave_type',
        'balance_minutes',
        'monthly_rate_minutes',
        'next_accrual_date',
        'next_yearly_date',
        'first_earned_at',
    ];

    protected $casts = [
        'balance_minutes'       => 'integer',
        'monthly_rate_minutes'  => 'integer',
        'next_accrual_date'     => 'date',
        'next_yearly_date'      => 'date',
        'first_earned_at'       => 'date',
        'updated_at'            => 'datetime',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(LeavePolicy::class, 'leave_type', 'leave_type');
    }

    /**
     * Balance as displayed to user (floor division by 480 minutes).
     */
    public function getDisplayBalanceAttribute(): int
    {
        return (int) floor($this->balance_minutes / 480);
    }
}
