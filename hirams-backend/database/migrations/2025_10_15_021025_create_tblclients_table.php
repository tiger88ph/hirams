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
        Schema::create('tblclients', function (Blueprint $table) {
            $table->id('nClientId');
            $table->string('strClientName', 100);
            $table->string('strClientNickName', 25);
            $table->string('strTIN', 15)->nullable();
            $table->string('strAddress', 200)->nullable();
            $table->string('strBusinessStyle', 20)->nullable();
            $table->string('strContactPerson', 40)->nullable();
            $table->string('strContactNumber', 50)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblclients');
    }
};
