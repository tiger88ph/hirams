<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'tblinventories';
    protected $primaryKey = 'nInventoryId';
    public $timestamps = false;

    protected $fillable = [
        'nPurchaseItemId',
        'nQuantity',
        'dtLog',
        'strReceiptNumber',
        'cStatus'
    ];

    protected $casts = [
        'dtLog' => 'datetime',
    ];

    public function purchaseOption()
    {
        return $this->belongsTo(PurchaseOptions::class, 'nPurchaseItemId', 'nPurchaseItemId');
    }

    public function serialNumbers()
    {
        return $this->hasMany(SerialNumber::class, 'nInventoryId', 'nInventoryId');
    }
}
