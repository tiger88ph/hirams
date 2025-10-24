<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transactions extends Model
{
    use HasFactory;

     // Specify the table name
    protected $table = 'tbltransactions';

    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nTransactionId';

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

     // ❌ Disable timestamps
    public $timestamps = false;
}
