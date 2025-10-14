<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    // Specify the table name
    protected $table = 'tblcompanies';

    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nCompanyId';

    protected $fillable = [
        'strCompanyName',
        'strCompanyNickName',
        'strTIN',
        'strAddress',
        'bVAT',
        'bEWT',
    ];

     // ❌ Disable timestamps
    public $timestamps = false;
    
}
