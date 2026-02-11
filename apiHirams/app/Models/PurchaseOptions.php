<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class PurchaseOptions extends Model
{
    use HasFactory;
    // Correct table name
    protected $table = 'tblPurchaseOptions';
    // Primary key
    protected $primaryKey = 'nPurchaseOptionId';
    // No timestamps in your table
    public $timestamps = false;
    // Fillable columns
    protected $fillable = [
        'nTransactionItemId',
        'nSupplierId',
        'nQuantity',
        'strUOM',
        'strBrand',
        'strModel',
        'strSpecs',
        'dUnitPrice',
        'dEWT',
        'strProductCode',
        'bIncluded',
        'bAddOn',
        'dtCanvass'
    ];
    // ✅ A purchase option belongs to a transaction item
    public function transactionItem()
    {
        return $this->belongsTo(TransactionItems::class, 'nTransactionItemId', 'nTransactionItemId');
    }
    // Optional: a purchase option belongs to a supplier (if you have a Supplier model)
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'nSupplierId', 'nSupplierId');
    }
}
