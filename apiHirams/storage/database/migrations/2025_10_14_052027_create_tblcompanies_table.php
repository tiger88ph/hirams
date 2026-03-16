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
        Schema::create('tblcompanies', function (Blueprint $table) {
            $table->id('nCompanyId'); // id is auto-increment, no need for int(11)
            $table->string('strCompanyName', 50);
            $table->string('strCompanyNickName', 20);
            $table->string('strTIN', 17)->nullable();
            $table->string('strAddress', 200)->nullable();
            $table->tinyInteger('bVAT')->nullable(); // or use ->boolean() if it's 0/1
            $table->tinyInteger('bEWT')->nullable(); // or use ->boolean()
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblcompanies');
    }
};
