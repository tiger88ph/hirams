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
        Schema::create('tblitempricings_', function (Blueprint $table) {
            $table->id('nItemPriceId');
            $table->integer('nPricingSetId');
            $table->integer('nTransactionItemId');
            $table->double('dUnitSellingPrice');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblitempricings_');
    }
};
