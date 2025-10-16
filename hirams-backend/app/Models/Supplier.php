<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory;

    // Specify the table name
    protected $table = 'tblsupplier';

    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nSupplierId';

    protected $fillable = [
        'strSupplierName',
        'strSupplierNickName', 
        'strAddress',
        'strTIN',
        'bVAT',
        'bEWT',
    ];

     // ❌ Disable timestamps
    public $timestamps = false;
}
