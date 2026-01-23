<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Supplier;

class SupplierBank extends Model
{
    use HasFactory;

    protected $table = 'tblsupplierbanks';

    protected $primaryKey = 'nSupplierBankId';

    protected $fillable = [
        'nSupplierId',
        'strBankName',
        'strAccountName',
        'strAccountNumber',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'nSupplierId', 'nSupplierId');
    }

     // ❌ Disable timestamps
    public $timestamps = false;

}
