<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('year_end_conversion_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('year_end_config_id')->constrained('year_end_config')->restrictOnDelete()->cascadeOnUpdate();
            $table->integer('employid')->comment('FK to masterlist.employee_details.employid (enforced at app level)');
            $table->integer('balance_before_minutes')->comment('VL balance_minutes at exact moment year-end ran for this employee');
            $table->integer('carryover_minutes')->default(0)->comment('= min(balance_before, max_carryover_days x 480)');
            $table->integer('converted_minutes')->default(0)->comment('= min(excess, max_convertible_days x 480)');
            $table->integer('forfeited_minutes')->default(0)->comment('= excess - converted_minutes. Balance lost.');
            $table->decimal('cash_amount', 10, 2)->default(0.00)->comment('= (converted_minutes / 480) x cash_rate_per_day');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['year_end_config_id', 'employid'], 'uq_config_employee');
            $table->index('employid', 'idx_employid');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('year_end_conversion_log');
    }
};
