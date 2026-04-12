<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('employee_leave_balance', function (Blueprint $table) {
            $table->id();
            $table->integer('employid')->comment('FK to masterlist.employee_details.employid (enforced at app level)');
            $table->string('leave_type', 20)->comment('Matches leave_policy.leave_type');
            $table->integer('balance_minutes')->default(0)->comment('Current balance in minutes. Display = floor(balance_minutes / 480).');
            $table->integer('monthly_rate_minutes')->nullable()->comment('For VL/SIL only. Current monthly accrual rate. NULL for yearly/event types.');
            $table->date('next_accrual_date')->nullable()->comment('For monthly types. When Block C next fires. NULL for yearly/event types.');
            $table->date('next_yearly_date')->nullable()->comment('Next Jan 1 when Block D fires. Advances by 1 year after each run.');
            $table->date('first_earned_at')->nullable()->comment('NULL until Block B fires for first time. Prevents Block B from re-firing.');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['employid', 'leave_type'], 'uq_employee_leave');
            $table->index('employid', 'idx_employid');
            $table->index('leave_type', 'idx_leave_type');
            $table->index('next_accrual_date', 'idx_next_accrual_date');
            $table->index('next_yearly_date', 'idx_next_yearly_date');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('employee_leave_balance');
    }
};
