<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YearEndConfig extends Model
{
    protected $connection = 'mysql';
    protected $table = 'year_end_config';
    public $timestamps = false;

    protected $fillable = [
        'year',
        'run_date',
        'max_carryover_days',
        'max_convertible_days',
        'cash_rate_per_day',
        'status',
        'ran_at',
    ];

    protected $casts = [
        'run_date'              => 'date',
        'max_carryover_days'    => 'integer',
        'max_convertible_days'  => 'integer',
        'cash_rate_per_day'     => 'decimal:2',
        'ran_at'                => 'datetime',
    ];

    public function conversionLogs(): HasMany
    {
        return $this->hasMany(YearEndConversionLog::class, 'year_end_config_id');
    }
}
