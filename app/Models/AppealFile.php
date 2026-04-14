<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppealFile extends Model
{
    protected $connection = 'mysql';
    protected $table = 'appeal_files';
    public $timestamps = false;

    protected $fillable = [
        'leave_id',
        'employid',
        'original_file_name',
        'file_location',
        'file_name',
        'file_type',
        'file_size',
        'date_filed',
        'reason',
    ];

    protected $casts = [
        'file_size'  => 'integer',
        'date_filed' => 'datetime',
    ];
}
