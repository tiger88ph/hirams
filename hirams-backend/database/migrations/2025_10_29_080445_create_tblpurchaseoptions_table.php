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
        Schema::create('tblPurchaseOptions', function (Blueprint $table) {
            $table->increments('nPurchaseOptionId'); // Primary key, AUTO_INCREMENT
            $table->integer('nTransactionItemId')->unsigned(); // Foreign key to transaction items
            $table->integer('nSupplierId')->unsigned(); // Supplier ID
            $table->integer('nQuantity'); // Quantity offered
            $table->string('strUOM', 20); // Unit of measure
            $table->string('strBrand', 30)->nullable(); // Brand
            $table->string('strModel', 40)->nullable(); // Model
            $table->string('strSpecs', 200)->nullable(); // Specs
            $table->double('dUnitPrice'); // Purchase price
            $table->double('dEWT')->nullable(); // Withholding tax
            $table->string('strProductCode', 30)->nullable(); // Product code
            $table->boolean('bIncluded'); // Whether included in final selection
            $table->dateTime('dtCanvass')->nullable(); // Canvass date

            // Optional: add foreign key constraints if needed
            // $table->foreign('nTransactionItemId')->references('nTransactionItemId')->on('tblTransactionItems')->onDelete('cascade');
            // $table->foreign('nSupplierId')->references('nSupplierId')->on('tblSuppliers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblpurchaseoptions');
    }
};
