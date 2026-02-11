<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PricingSet;
use App\Models\TransactionItems;

class ItemPricings extends Model
{
    use HasFactory;
    
    protected $table = 'tblitemPricings';
    protected $primaryKey = 'nItemPriceId';
    
    protected $fillable = [
        'nPricingSetId',
        'nTransactionItemId',
        'dUnitSellingPrice'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'nPricingSetId' => 'integer',
        'nTransactionItemId' => 'integer',
        'dUnitSellingPrice' => 'double'
    ];

    // ✅ Item pricing belongs to pricing set
    public function pricingSet()
    {
        return $this->belongsTo(PricingSet::class, 'nPricingSetId', 'nPricingSetId');
    }

    // ✅ Item pricing belongs to a transaction item
    public function transactionItem()
    {
        return $this->belongsTo(TransactionItems::class, 'nTransactionItemId', 'nTransactionItemId');
    }
}