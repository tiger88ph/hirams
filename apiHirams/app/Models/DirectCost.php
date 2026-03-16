<?php

namespace App\Models;

use App\Models\DirectCostOptions;
use Illuminate\Database\Eloquent\Model;

class DirectCost extends Model
{
    protected $table = 'tbldirectcost';
    protected $primaryKey = 'nDirectCostID';
    public $timestamps = false;

    protected $fillable = [
        'nTransactionID',
        'nDirectCostOptionID',
        'dAmount'
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function option()
    {
        return $this->belongsTo(
            DirectCostOptions::class,
            'nDirectCostOptionID',
            'nDirectCostOptionID'
        );
    }

    // Uncomment if transaction model exists
    /*
    public function transaction()
    {
        return $this->belongsTo(
            Transaction::class,
            'nTransactionID',
            'nTransactionID'
        );
    }
    */
}
