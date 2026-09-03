<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jev extends Model
{
    protected $table = 'tbljev';
    protected $primaryKey = 'nJEVId';
    public $timestamps = false;

    protected $fillable = [
        'cJEVLinkType',
        'dtOccur',
        'cStatus',
    ];

    // ── Relationships ──────────────────────────────────────
    public function entries(): HasMany
    {
        return $this->hasMany(JevEntries::class, 'nJEVId', 'nJEVId');
    }
    public function vouchers()
    {
        return $this->hasMany(Voucher::class, 'nJEVId', 'nJEVId');
    }
}
