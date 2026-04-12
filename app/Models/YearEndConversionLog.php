<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YearEndConversionLog extends Model
{
    protected $connection = 'mysql';
    protected $table = 'year_end_conversion_log';
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'year_end_config_id',
        'employid',
        'balance_before_minutes',
        'carryover_minutes',
        'converted_minutes',
        'forfeited_minutes',
        'cash_amount',
    ];

    protected $casts = [
        'year_end_config_id'     => 'integer',
        'employid'               => 'integer',
        'balance_before_minutes' => 'integer',
        'carryover_minutes'      => 'integer',
        'converted_minutes'      => 'integer',
        'forfeited_minutes'      => 'integer',
        'cash_amount'            => 'decimal:2',
        'created_at'             => 'datetime',
    ];

    public function yearEndConfig(): BelongsTo
    {
        return $this->belongsTo(YearEndConfig::class, 'year_end_config_id');
    }
}
