<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignee extends Model
{
    protected $table = 'tblassignee';
    protected $primaryKey = 'nAssigneeId';
    public $timestamps = false;

    protected $fillable = [
        'strAssigneeName',
        'strAssigneeNickName',
        'strAddress',
        'strTIN',
        'cStatus',
    ];

    public function voucherAssignees()
    {
        return $this->hasMany(VoucherAssignee::class, 'nAssigneeId', 'nAssigneeId');
    }
}