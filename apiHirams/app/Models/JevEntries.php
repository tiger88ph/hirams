<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JevEntries extends Model
{
    protected $table = 'tbljeventries';
    protected $primaryKey = 'nJEVEntryId'; 
    public $timestamps = false;

    protected $fillable = [
        'nJEVId',
        'nJournalAccountId',
        'dAmount',
    ];

    // ── Relationships ──────────────────────────────────────
    public function jev(): BelongsTo
    {
        return $this->belongsTo(Jev::class, 'nJEVId', 'nJEVId');
    }

    public function journal_account(): BelongsTo
    {
        return $this->belongsTo(JournalAccount::class, 'nJournalAccountId', 'nJournalAccountId');
    }
}