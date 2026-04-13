<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveRequest extends Model
{
    protected $connection = 'mysql';
    protected $table = 'leave_requests';

    protected $fillable = [
        'employid',
        'leave_type',
        'date_start',
        'date_end',
        'hours_per_day',
        'working_days',
        'deduction_minutes',
        'reason',
        'status',
        'remarks',
        'admin_remarks',
        'is_late_filing',
        'with_appeal',
        'appeal_status',
        'is_batch',
        'period',
        'date_posted',
    ];

    protected $casts = [
        'date_start'        => 'date:Y-m-d',
        'date_end'          => 'date:Y-m-d',
        'date_posted'       => 'date:Y-m-d',
        'hours_per_day'     => 'integer',
        'working_days'      => 'integer',
        'deduction_minutes' => 'integer',
        'is_late_filing'    => 'boolean',
        'with_appeal'       => 'boolean',
        'is_batch'          => 'boolean',
        'created_at'        => 'datetime',
        'updated_at'        => 'datetime',
    ];

    public function approvers(): HasMany
    {
        return $this->hasMany(LeaveApprover::class, 'leave_request_id');
    }

    public function accrualLogs(): HasMany
    {
        return $this->hasMany(LeaveAccrualLog::class, 'leave_request_id');
    }
}
