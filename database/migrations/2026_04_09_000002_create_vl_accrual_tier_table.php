<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('vl_accrual_tier', function (Blueprint $table) {
            $table->id();
            $table->enum('tier', ['new', 'legacy'])->comment('new=hired April 2024 onwards, legacy=hired before April 2024');
            $table->integer('year_from')->comment('Inclusive start of bracket. Years since regularization. 0=first year.');
            $table->integer('year_to')->nullable()->comment('Inclusive end of bracket. NULL=no cap.');
            $table->integer('monthly_minutes')->comment('Exact minutes earned per month. 280=7bal/yr ... 480=12bal/yr.');

            $table->unique(['tier', 'year_from'], 'uq_tier_year');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('vl_accrual_tier');
    }
};
