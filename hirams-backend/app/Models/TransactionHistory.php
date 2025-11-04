<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TransactionHistory extends Model
{
       use HasFactory;

    protected $table = 'tbltransactionhistories';

    protected $primaryKey = 'nTransactionHistoryId';

    protected $fillable = [
        'nTransactionId',
        'dtOccur',
        'nStatus',
        'nUserId',
        'strRemarks',
        'bValid'
    ];

     // ❌ Disable timestamps
    public $timestamps = false;
}
