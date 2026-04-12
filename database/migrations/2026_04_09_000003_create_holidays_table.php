<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('holiday_date')->unique()->comment('The non-working date');
            $table->string('name', 100)->comment('e.g. Araw ng Kagitingan, Eid al-Fitr, Company Foundation Day');
            $table->enum('type', ['regular', 'special', 'company'])->comment('regular=national regular holiday, special=special non-working, company=company-specific');
            $table->tinyInteger('is_paid')->default(1)->comment('1=paid holiday, 0=unpaid. For payroll reference.');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('holidays');
    }
};
