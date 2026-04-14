<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('mysql')->table('leave_requests', function (Blueprint $table) {
            $table->integer('paid_minutes')->default(0)
                ->after('deduction_minutes')
                ->comment('Minutes covered by the employee\'s available balance (with pay)');
            $table->integer('unpaid_minutes')->default(0)
                ->after('paid_minutes')
                ->comment('Minutes that exceeded the balance (without pay)');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql')->table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['paid_minutes', 'unpaid_minutes']);
        });
    }
};
