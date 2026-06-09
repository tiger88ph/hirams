<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherAssignee extends Model
{
    protected $table = 'tblvoucher_assignee';
    protected $primaryKey = 'nVoucherAssigneeId';
    public $timestamps = false;

    protected $fillable = [
        'nVoucherId',
        'nAssigneeId',
        'strParticular',
        'dAmount',
    ];

    public function voucher()
    {
        return $this->belongsTo(Voucher::class, 'nVoucherId', 'nVoucherId');
    }

    public function assignee()
    {
        return $this->belongsTo(Assignee::class, 'nAssigneeId', 'nAssigneeId');
    }
}