<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'tblinventory';
    protected $primaryKey = 'nInventoryId';
    public $timestamps = false;

    protected $fillable = [
        'nPurchaseOptionId',
        'nQuantity',
        'dtLog',
    ];

    protected $casts = [
        'dtLog' => 'datetime',
    ];

    public function purchaseOption()
    {
        return $this->belongsTo(PurchaseOptions::class, 'nPurchaseOptionId', 'nPurchaseOptionId');
    }

    public function serialNumbers()
    {
        return $this->hasMany(SerialNumber::class, 'nInventoryId', 'nInventoryId');
    }
}