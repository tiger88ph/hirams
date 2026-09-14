<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderOption extends Model
{
    use HasFactory;

    protected $table = 'tblpurchaseorder_items';
    protected $primaryKey = 'nPurchaseOrder_ItemId';

    protected $fillable = [
        'nPurchaseOrderId',
        'nPurchaseItemId',
        'dtAddedToCart',
    ];

    protected $casts = [
        'dtAddedToCart' => 'datetime',
    ];

    public $timestamps = false;
    public function purchaseOption()
    {
        return $this->belongsTo(PurchaseOptions::class, 'nPurchaseItemId', 'nPurchaseItemId');
    }

    public function latestHistory()
    {
        return $this->hasOne(PurchaseItemHistory::class, 'nPurchaseOrder_ItemId', 'nPurchaseOrder_ItemId')
            ->latestOfMany('dtOccur');
    }
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'nPurchaseOrderId', 'nPurchaseOrderId');
    }
    
}
