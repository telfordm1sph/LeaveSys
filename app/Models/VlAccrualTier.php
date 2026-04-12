<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VlAccrualTier extends Model
{
    protected $connection = 'mysql';
    protected $table = 'vl_accrual_tier';
    public $timestamps = false;

    protected $fillable = [
        'tier',
        'year_from',
        'year_to',
        'monthly_minutes',
    ];

    protected $casts = [
        'year_from'        => 'integer',
        'year_to'          => 'integer',
        'monthly_minutes'  => 'integer',
    ];
}
