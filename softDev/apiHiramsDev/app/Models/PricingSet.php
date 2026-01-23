<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Transactions;
use App\Models\ItemPricings;

class PricingSet extends Model
{
    use HasFactory;

    protected $table = 'tblPricingSets';

    protected $primaryKey = 'nPricingSetId';

    protected $fillable = [
        'nTransactionId',
        'strName',
        'bChosen'
    ];

    public $timestamps = false;

      // ✅ A pricing set belongs to a transaction
    public function transaction()
    {
        return $this->belongsTo(Transactions::class, 'nTransactionId', 'nTransactionId');
    }

    // ✅ A pricing set has many item pricings
    public function itemPricings()
    {
        return $this->hasMany(ItemPricings::class, 'nPricingSetId', 'nPricingSetId');
    }
}
