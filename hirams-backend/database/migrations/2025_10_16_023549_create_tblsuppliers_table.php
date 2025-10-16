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
        Schema::create('tblsuppliers', function (Blueprint $table) {
            $table->id('nSupplierId');
            $table->string('strSupplierName', 100);
            $table->string('strNickName', 25);
            $table->string('strAddress', 200)->nullable();
            $table->string('strTIN', 20)->nullable();
            $table->tinyInteger('bVAT')->default(0);
            $table->tinyInteger('bEWT')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblsuppliers');
    }
};
