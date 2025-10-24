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
        Schema::create('tbltransactionitems', function (Blueprint $table) {
            $table->id('nTransactionItemId');
            $table->integer('nTransactionId');
            $table->integer('nItemNumber');
            $table->integer('nQuantity');
            $table->string('strUOM', 10);
            $table->string('strName', 200);
            $table->string('strSpecs', 2000)->nullable();
            $table->double('dUnitABC')->nullable();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbltransactionitems');
    }
};
