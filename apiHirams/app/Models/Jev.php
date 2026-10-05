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
        $year   = now()->format('Y');
        $prefix = "JV{$year}-";                 // e.g. JV2026-

        $last = static::where('strJEVNumber', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(strJEVNumber, ?) AS UNSIGNED) DESC', [strlen($prefix) + 1])
            ->lockForUpdate()
            ->value('strJEVNumber');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);   // JV2026-0001
    }
}
