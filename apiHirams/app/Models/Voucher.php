<?php
// app/Models/Voucher.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $table = 'tblvoucher';
    protected $primaryKey = 'nVoucherId';
    public $timestamps = false;
    protected $fillable = [
        'cType',
        'nTypeId',
        'strNumber',
        'cStatus',
        'dtCreated'
    ];

    // nTypeId = nSupplierId when cType = 'S'
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'nTypeId', 'nSupplierId');
    }
    // Voucher.php — remove the nested with() from the relationship definition
    public function voucher_assignees()
    {
        return $this->hasMany(VoucherAssignee::class, 'nVoucherId', 'nVoucherId');
        // no ->with('assignee') here — let the controller handle it
    }
    public function voucher_suppliers()
    {
        return $this->hasMany(VoucherSupplier::class, 'nVoucherId', 'nVoucherId');
    }
}
