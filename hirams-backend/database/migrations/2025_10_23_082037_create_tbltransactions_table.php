<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbltransactions', function (Blueprint $table) {
            $table->id('nTransactionId');
            $table->integer('nCompanyId')->nullable();
            $table->integer('nClientId');
            $table->integer('nAssignedAO')->nullable();
            $table->string('strTitle', 500);
            $table->string('strRefNumber')->nullable();
            $table->double('dTotalABC')->nullable();
            $table->char('cProcMode', 1)->nullable();
            $table->char('cItemType', 1);
            $table->string('strCode', 30)->nullable();
            $table->char('cProcSource', 1)->nullable();
            $table->char('cProcStatus', 1)->nullable();
            $table->date('dtPreBid')->nullable();
            $table->string('strPreBid_Venue',70)->nullable();
            $table->date('dtDocIssuance')->nullable();
            $table->string('strDocIssuance_Venue',70)->nullable();
            $table->date('dtDocSubmission')->nullable();
            $table->string('strDocSubmission_Venue',70)->nullable();
            $table->date('dtDocOpening')->nullable();
            $table->string('strDocOpening_Venue',70)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbltransactions');
    }
};
