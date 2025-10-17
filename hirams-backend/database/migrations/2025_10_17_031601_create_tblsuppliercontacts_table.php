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
        Schema::create('tblsuppliercontacts', function (Blueprint $table) {
            $table->id('nSupplierContactId');
            $table->integer('nSupplierId');
            $table->string('strName', 50);
            $table->string('strNumber', 50);
            $table->string('strPosition', 50)->nullable();
            $table->string('strDepartment', 50)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblsuppliercontacts');
    }
};
