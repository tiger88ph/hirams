<?php
// app/Models/VoucherSupplier.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class VoucherSupplier extends Model
{
    protected $table = 'tblvoucher_supplier';
    protected $primaryKey = 'nVoucherSupplierId';
    public $timestamps = false;
    protected $fillable = [
        'nVoucherId',
        'nPurchaseOrderId'
    ];

    public function purchase_order()
    {
        return $this->belongsTo(PurchaseOrder::class, 'nPurchaseOrderId', 'nPurchaseOrderId');
    }
}