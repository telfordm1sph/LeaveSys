<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appeal_files', function (Blueprint $table) {
            $table->id();
            $table->string('leave_id', 100)->comment('FK to leave_requests.id (enforced at app level)');
            $table->string('employid', 45);
            $table->string('original_file_name', 150);
            $table->string('file_location', 250);
            $table->string('file_name', 250);
            $table->string('file_type', 250)->nullable();
            $table->integer('file_size')->nullable()->comment('File size in bytes');
            $table->dateTime('date_filed');
            $table->string('reason', 250)->nullable()->comment('Appeal reason text');

            $table->index('leave_id', 'idx_appeal_leave_id');
            $table->index('employid', 'idx_appeal_employid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appeal_files');
    }
};
