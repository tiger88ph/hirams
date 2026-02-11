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
        Schema::create('tblusers', function (Blueprint $table) {
            $table->id('nUserId');
            $table->string('strFName', 50);
            $table->string('strMName', 50)->nullable();
            $table->string('strLName', 50);
            $table->string('strNickName', 20);
            $table->char('cUserType', 1);
            $table->char('cSex', 1);
            $table->string('strProfileImage', 100);
            $table->string('strEmail', 50)->unique();
            $table->string('strUserName', 50)->unique();
            $table->string('strPassword', 100);
            $table->rememberToken()->nullable(); // remember_token
            $table->tinyInteger('bIsActive');
            $table->char('cStatus', 1);
            $table->timestamp('dtUpdatedAt')->nullable();
            $table->timestamp('dtCreatedAt')->nullable();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblusers');
    }
};
