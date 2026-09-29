<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jev extends Model
{
    protected $table = 'tbljevs';
    protected $primaryKey = 'nJEVId';
    public $timestamps = false;

    protected $fillable = [
        'strJEVNumber',
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
    public static function generateNumber(): string
    {
        // call inside DB::transaction so the lock works
        $last = static::where('strJEVNumber', 'like', 'JV%')
            ->orderByRaw('CAST(SUBSTRING(strJEVNumber, 3) AS UNSIGNED) DESC')
            ->lockForUpdate()
            ->value('strJEVNumber');

        $next = $last ? ((int) substr($last, 2)) + 1 : 1;

        return 'JV' . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
