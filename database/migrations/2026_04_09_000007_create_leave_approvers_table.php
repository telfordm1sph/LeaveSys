<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('leave_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained('leave_requests')->cascadeOnDelete()->cascadeOnUpdate();
            $table->integer('approver_employid')->comment('FK to masterlist.employee_details.employid (enforced at app level)');
            $table->integer('approver_level')->comment('1=first approver, 2=second, 3=third. Determines order of approval.');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable()->comment('This approver remarks.');
            $table->dateTime('decided_at')->nullable()->comment('When this approver acted. NULL if still pending.');

            $table->unique(['leave_request_id', 'approver_employid'], 'uq_request_approver');
            $table->index('approver_employid', 'idx_approver_employid');
            $table->index('status', 'idx_status');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('leave_approvers');
    }
};
