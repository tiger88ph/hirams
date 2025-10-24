<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class ItemPricings extends Model
{
    use HasFactory;

    protected $table = 'tblItemPrincings';

    protected $primaryKey = 'nItemIdPriceId';

    protected $fillable = [
        'nPricingSetId',
        'nTransactionItemId',
        'dUnitSellingPrice'
    ];

    public $timestamps = false;
}
