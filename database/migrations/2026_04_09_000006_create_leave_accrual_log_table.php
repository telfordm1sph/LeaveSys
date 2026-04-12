<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('leave_accrual_log', function (Blueprint $table) {
            $table->id();
            $table->integer('employid')->comment('FK to masterlist.employee_details.employid (enforced at app level)');
            $table->string('leave_type', 20)->comment('Which leave type was affected');
            $table->enum('action_type', [
                'accrual',
                'yearly_reset',
                'used',
                'refund',
                'carryover',
                'converted',
                'forfeited',
                'opening_balance',
                'manual_adj',
            ])->comment('accrual=Block C monthly, yearly_reset=Block D Jan 1 grant, used=leave filed, refund=rejected/cancelled, carryover=year-end, converted=cash, forfeited=excess lost, opening_balance=migration, manual_adj=admin correction');
            $table->integer('minutes_before')->comment('balance_minutes before this action');
            $table->integer('minutes_delta')->comment('Change amount. Positive=credit. Negative=debit.');
            $table->integer('minutes_after')->comment('balance_minutes after. Always = minutes_before + minutes_delta.');
            $table->foreignId('leave_request_id')->nullable()->constrained('leave_requests')->nullOnDelete()->cascadeOnUpdate()->comment('Only set when action_type is used or refund.');
            $table->string('remarks', 255)->nullable()->comment('Human readable note. e.g. April 2026 Monthly VL Accrual');
            $table->enum('triggered_by', ['system', 'admin', 'employee'])->default('system')->comment('Who caused this change');
            $table->timestamp('created_at')->useCurrent()->comment('Immutable. Never updated.');

            $table->index('employid', 'idx_employid');
            $table->index('leave_type', 'idx_leave_type');
            $table->index('action_type', 'idx_action_type');
            $table->index('leave_request_id', 'idx_leave_request_id');
            $table->index('created_at', 'idx_created_at');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('leave_accrual_log');
    }
};
