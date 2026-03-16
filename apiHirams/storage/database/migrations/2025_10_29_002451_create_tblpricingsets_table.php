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
        Schema::create('tblpricingsets', function (Blueprint $table) {
            $table->id('nPricingSetId');
            $table->unsignedBigInteger('nTransactionId');
            $table->string('strName', 20);
            $table->tinyInteger('bChosen')->default(0); // 0 = not chosen, 1 = chosen
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblpricingsets');
    }
};
