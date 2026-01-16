<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ItemPricings;
use App\Models\PricingSet;
use App\Models\PurchaseOptions;

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

     // ✅ Each Transaction Item can have many pricing records
    public function itemPricings()
    {
        return $this->hasMany(ItemPricings::class, 'nTransactionItemId', 'nTransactionItemId');
    }

      // ✅ Each ItemPricing belongs to one Pricing Set
    public function pricingSet()
    {
        return $this->belongsTo(PricingSet::class, 'nPricingSetId', 'nPricingSetId');
    }

    public function purchaseOptions()
    {
        return $this->hasMany(PurchaseOptions::class, 'nTransactionItemId', 'nTransactionItemId');
    }

}
