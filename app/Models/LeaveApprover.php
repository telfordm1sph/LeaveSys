<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApprover extends Model
{
    protected $connection = 'mysql';
    protected $table = 'leave_approvers';
    public $timestamps = false;

    protected $fillable = [
        'leave_request_id',
        'approver_employid',
        'approver_level',
        'status',
        'remarks',
        'decided_at',
    ];

    // Approver names are resolved from HRIS on demand (not stored in DB).

    protected $casts = [
        'leave_request_id'  => 'integer',
        'approver_employid' => 'integer',
        'approver_level'    => 'integer',
        'decided_at'        => 'datetime',
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id');
    }
}
