<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherAssignee extends Model
{
    protected $table = 'tblvoucher_assignees';
    protected $primaryKey = 'nVoucherAssigneeId';
    public $timestamps = false;

    protected $fillable = [
        'nVoucherId',
        'nAssigneeId',
        'strParticular',
        'nQuantity',
        'dAmount',
        'strUOM'
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
