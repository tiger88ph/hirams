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
        Schema::create('tbltransactionhistories', function (Blueprint $table) {
            $table->id('nTransactionHistoryId');
            $table->integer('nTransactionId');
            $table->dateTime('dtOccur');
            $table->integer('nStatus');
            $table->integer('nUserId')->nullable();
            $table->string('strRemarks', 200)->nullable();
            $table->boolean('bValid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbltransactionhistories');
    }
};
