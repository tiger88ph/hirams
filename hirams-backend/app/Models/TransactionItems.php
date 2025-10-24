<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TransactionItems extends Model
{
    use HasFactory;

    // Specify the table name
    protected $table = 'tbltransactionitems';

    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nTransactionItemId';

    protected $fillable = [
        'nTransactionId',
        'nItemNumber',
        'nQuantity',
        'strUOM',
        'strName',
        'strSpecs',
        'dUnitABC',
    ];

     // ❌ Disable timestamps
    public $timestamps = false;
}
