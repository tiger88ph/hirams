<?php

namespace App\Models;

use App\Models\DirectCost;
use Illuminate\Database\Eloquent\Model;

class DirectCostOptions extends Model
{
    protected $table = 'tbldirectcostoptions';
    protected $primaryKey = 'nDirectCostOptionID';
    public $timestamps = false;

    protected $fillable = [
        'strName'
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function directCosts()
    {
        return $this->hasMany(
            DirectCost::class,
            'nDirectCostOptionID',
            'nDirectCostOptionID'
        );
    }
}
