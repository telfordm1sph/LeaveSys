<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('leave')->create('year_end_config', function (Blueprint $table) {
            $table->id();
            $table->year('year')->unique()->comment('The year this config applies to. One row per year only.');
            $table->date('run_date')->comment('Admin picks this. Cron fires when current date >= run_date and status = pending.');
            $table->integer('max_carryover_days')->default(0)->comment('Max VL balance that rolls over to next year.');
            $table->integer('max_convertible_days')->default(0)->comment('Max VL balance from excess that can convert to cash.');
            $table->decimal('cash_rate_per_day', 10, 2)->default(0.00)->comment('Peso per balance when converting to cash this year.');
            $table->enum('status', ['pending', 'completed'])->default('pending')->comment('pending=not yet run. completed=done, cron will never re-run.');
            $table->timestamp('ran_at')->nullable()->comment('Exact timestamp when job ran. NULL until completed.');
        });
    }

    public function down(): void
    {
        Schema::connection('leave')->dropIfExists('year_end_config');
    }
};
