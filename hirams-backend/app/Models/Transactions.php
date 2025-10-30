<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Client;
use App\Models\Company;
use App\Models\User;
use App\Models\TransactionItems;

class Transactions extends Model
{
    use HasFactory;

    protected $table = 'tbltransactions';
    protected $primaryKey = 'nTransactionId';
    public $timestamps = false;

    protected $fillable = [
        'nCompanyId',
        'nClientId',
        'nAssignedAO',
        'strTitle',
        'strRefNumber',
        'dTotalABC',
        'cProcMode',
        'cItemType',
        'strCode',
        'cProcSource',
        'cProcStatus',
        'dtPreBid',
        'strPreBid_Venue',
        'dtDocIssuance',
        'strDocIssuance_Venue',
        'dtDocSubmission',
        'strDocSubmission_Venue',
        'dtDocOpening',
        'strDocOpening_Venue',
    ];

    // ✅ Relationship: Transaction belongs to Company
    public function company()
    {
        return $this->belongsTo(Company::class, 'nCompanyId', 'nCompanyId');
    }

    // ✅ Relationship: Transaction belongs to Client
    public function client()
    {
        return $this->belongsTo(Client::class, 'nClientId', 'nClientId');
    }

    // ✅ Relationship: Transaction belongs to User (Assigned AO)
    public function user()
    {
        return $this->belongsTo(User::class, 'nAssignedAO', 'nUserId');
    }

    // In Transactions.php
    public function transactionItems()
    {
        return $this->hasMany(TransactionItems::class, 'nTransactionId', 'nTransactionId');
    }

}
