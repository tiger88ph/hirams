<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('tbldirectcost', function (Blueprint $table) {
            $table->id('nDirectCostID');

            $table->integer('nTransactionID')->unsigned();
            $table->integer('nDirectCostOptionID')->unsigned();

            $table->double('dAmount');

            // Foreign Keys (recommended)
            // $table->foreign('nDirectCostOptionID')
            //     ->references('nDirectCostOptionID')
            //     ->on('tbldirectcostoptions')
            //     ->cascadeOnDelete();

            // Uncomment if transaction table exists
            // $table->foreign('nTransactionID')
            //       ->references('nTransactionID')
            //       ->on('tbltransactions')
            //       ->cascadeOnDelete();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbldirectcost');
    }
};
