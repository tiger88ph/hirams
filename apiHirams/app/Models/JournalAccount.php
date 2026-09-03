<?php
// app/Models/JournalAccount.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalAccount extends Model
{
    protected $table = 'tbljournalaccounts';
    protected $primaryKey = 'nJournalAccountId';
    public $timestamps = false;

protected $fillable = [
    'strAccountName',
    'nParentAccountId'
];

public function parent()
{
    return $this->belongsTo(JournalAccount::class, 'nParentAccountId', 'nJournalAccountId');
}

public function children()
{
    return $this->hasMany(JournalAccount::class, 'nParentAccountId', 'nJournalAccountId');
}
}