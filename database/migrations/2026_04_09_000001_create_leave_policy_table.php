<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('leave_policy', function (Blueprint $table) {
            $table->id();
            $table->string('leave_type', 20)->unique()->comment('Short code: VL, SL, BL, EL, BEREAVEMENT, MATERNITY, PATERNITY, VAWC, SLW, SPL, MILITARY, SIL');
            $table->string('label', 100)->comment('Display name: Vacation Leave, Sick Leave, etc.');
            $table->enum('earn_type', ['monthly', 'yearly', 'event'])->comment('monthly=accrues each month, yearly=granted Jan 1, event=granted when event occurs');
            $table->integer('yearly_grant_minutes')->nullable()->comment('For yearly/event types only. NULL for monthly types.');
            $table->enum('applies_to_hire_tier', ['all', 'new', 'legacy'])->default('all')->comment('all=everyone, new=hired after Apr 2024, legacy=hired before Apr 2024');
            $table->tinyInteger('is_convertible')->default(0)->comment('1=can convert unused balance to cash at year-end');
            $table->integer('max_carryover_days')->default(0)->comment('Max balance that rolls over to next year. 0=none.');
            $table->integer('max_convertible_days')->default(0)->comment('Max balance convertible to cash at year-end. 0=none.');
            $table->decimal('cash_rate_per_day', 10, 2)->default(0.00)->comment('Peso amount per balance when converting to cash');
            $table->tinyInteger('is_active')->default(1)->comment('1=active, 0=disabled without deleting');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('leave_policy');
    }
};
