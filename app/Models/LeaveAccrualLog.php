<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveAccrualLog extends Model
{
    protected $connection = 'mysql';
    protected $table = 'leave_accrual_log';
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'employid',
        'leave_type',
        'action_type',
        'minutes_before',
        'minutes_delta',
        'minutes_after',
        'leave_request_id',
        'remarks',
        'triggered_by',
    ];

    protected $casts = [
        'minutes_before'    => 'integer',
        'minutes_delta'     => 'integer',
        'minutes_after'     => 'integer',
        'leave_request_id'  => 'integer',
        'created_at'        => 'date:Y-m-d',
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id');
    }
}
