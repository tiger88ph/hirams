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
        Schema::create('tbldirectcostoptions', function (Blueprint $table) {
            $table->id('nDirectCostOptionID');
            $table->string('strName', 20);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('tbldirectcostoptions');
    }
};
