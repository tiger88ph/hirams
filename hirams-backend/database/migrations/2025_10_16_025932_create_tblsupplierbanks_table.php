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
        Schema::create('tblsupplierbanks', function (Blueprint $table) {
            $table->id('nSupplierBankId');
            $table->integer('nSupplierId');
            $table->string('strBankName', 50);
            $table->string('strAccountName', 100);
            $table->string('strAccountNumber', 50);
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblsupplierbanks');
    }
};
