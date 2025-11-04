<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Transactions;

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

    // TransactionHistory.php
    public function transaction()
    {
        return $this->belongsTo(Transactions::class, 'transaction_id');
    }
}
