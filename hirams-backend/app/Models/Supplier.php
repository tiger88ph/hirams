<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\SupplierBank;
use App\Models\SupplierContact;
class Supplier extends Model
{
    use HasFactory;
    // Specify the table name
    protected $table = 'tblsuppliers';
    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nSupplierId';
    protected $fillable = [
        'strSupplierName',
        'strSupplierNickName', 
        'strAddress',
        'strTIN',
        'bVAT',
        'bEWT',
        'cStatus',
    ];
     // ❌ Disable timestamps
    public $timestamps = false;
     // One supplier can have many bank accounts
    public function banks()
    {
        return $this->hasMany(SupplierBank::class, 'nSupplierId', 'nSupplierId');
    }
    // One supplier can have many contacts
    public function contacts()
    {
        return $this->hasMany(SupplierContact::class, 'nSupplierId', 'nSupplierId');
    }
}
