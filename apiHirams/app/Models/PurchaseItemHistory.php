<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItemHistory extends Model
{
    protected $table = 'tblpurchaseitemhistories';

    protected $primaryKey = 'nPurchaseItemHistoryId';

    public $timestamps = false;

    protected $fillable = [
        'nPurchaseOrder_OptionId',
        'nStatus',
        'nUserId',
        'dtOccur',
    ];

    protected $casts = [
        'dtOccur' => 'datetime',
    ];
}