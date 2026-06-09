<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'tblpurchaseorder';
    protected $primaryKey = 'nPurchaseOrderId';

    protected $fillable = [
        'strPurchaseOrderNo',
        'strShippingDetails',
        'cPaymentTerms',
        'cStatus',
        'dtProceedToPayment',
        'dtPurchaseOrderCreated'
    ];

    protected $casts = [
        'dtProceedToPayment' => 'datetime',
        'dtPurchaseOrderCreated' => 'datetime',
    ];

    public $timestamps = false;
    public function purchaseOrderOptions()
{
    return $this->hasMany(PurchaseOrderOption::class, 'nPurchaseOrderId', 'nPurchaseOrderId');
}
}