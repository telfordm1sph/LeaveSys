<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->integer('employid')->comment('FK to masterlist.employee_details.employid (enforced at app level)');
            $table->string('leave_type', 20)->comment('Matches leave_policy.leave_type');
            $table->date('date_start')->comment('First day of leave period');
            $table->date('date_end')->comment('Last day of leave period');
            $table->integer('hours_per_day')->comment('Employee picks when filing: 8, 10, 12, etc.');
            $table->integer('working_days')->default(0)->comment('Actual working days excluding weekends and holidays. Computed on file.');
            $table->integer('deduction_minutes')->default(0)->comment('Exact minutes deducted: working_days x hours_per_day x 60. Stored for exact refund.');
            $table->text('reason')->nullable()->comment('Employee reason for leave');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('remarks')->nullable();
            $table->text('admin_remarks')->nullable();
            $table->tinyInteger('is_late_filing')->default(0)->comment('1=filed after leave dates passed');
            $table->tinyInteger('with_appeal')->default(0)->comment('1=employee has appealed a rejection');
            $table->enum('appeal_status', ['none', 'pending', 'approved', 'rejected'])->default('none');
            $table->tinyInteger('is_batch')->default(0)->comment('1=part of a batch filing');
            $table->string('period', 40)->nullable()->comment('Payroll period reference');
            $table->date('date_posted')->nullable()->comment('Date the leave was filed');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('employid', 'idx_employid');
            $table->index('leave_type', 'idx_leave_type');
            $table->index('status', 'idx_status');
            $table->index('date_start', 'idx_date_start');
            $table->index('date_end', 'idx_date_end');
            $table->index('date_posted', 'idx_date_posted');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('leave_requests');
    }
};
