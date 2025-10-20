<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Supplier;

class SupplierContact extends Model
{
     use HasFactory;

    protected $table = 'tblsuppliercontacts';

    protected $primaryKey = 'nSupplierContactId';

    protected $fillable = [
        'strSupplierId',
        'strName',
        'strNumber',
        'strPosition',
        'strDepartment',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'nSupplierId', 'nSupplierId');
    }

     // ❌ Disable timestamps
    public $timestamps = false;
}
