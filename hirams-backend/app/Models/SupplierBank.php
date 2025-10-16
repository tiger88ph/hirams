<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SupplierBank extends Model
{
    use HasFactory;

    protected $table = 'tblsupplierbank';

    protected $primaryKey = 'nSupplierBankId';

    protected $fillable = [
        'strSupplierId',
        'strBankName',
        'strBankAccountName',
        'strBankAccountNumber',
    ];

}
