<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerialNumber extends Model
{
    use HasFactory;

    protected $table = 'tblserialnumbers';
    protected $primaryKey = 'nSNId';
    public $timestamps = false;

    protected $fillable = [
        'nInventoryId',
        'strSerialNumber',
        'dtLog',
    ];

    protected $casts = [
        'dtLog' => 'datetime',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'nInventoryId', 'nInventoryId');
    }
}