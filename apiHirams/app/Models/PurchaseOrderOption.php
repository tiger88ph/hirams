<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderOption extends Model
{
    use HasFactory;

    protected $table = 'tblpurchaseorder_option';
    protected $primaryKey = 'nPurchaseOrder_OptionId';

    protected $fillable = [
        'nPurchaseOrderId',
        'nPurchaseOptionId',
        'dtAddedToCart',
    ];

    protected $casts = [
        'dtAddedToCart' => 'datetime',
    ];

    public $timestamps = false;
    public function purchaseOption()
{
    return $this->belongsTo(PurchaseOptions::class, 'nPurchaseOptionId', 'nPurchaseOptionId');
}

public function latestHistory()
{
    return $this->hasOne(PurchaseItemHistory::class, 'nPurchaseOrder_OptionId', 'nPurchaseOrder_OptionId')
        ->latestOfMany('dtOccur');
}

}
