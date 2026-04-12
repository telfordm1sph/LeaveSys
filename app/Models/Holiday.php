<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $connection = 'mysql';
    protected $table = 'holidays';
    public $timestamps = false;

    protected $fillable = [
        'holiday_date',
        'name',
        'type',
        'is_paid',
    ];

    protected $casts = [
        'holiday_date'  => 'date',
        'is_paid'       => 'boolean',
    ];
}
