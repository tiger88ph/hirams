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
        'nParentAccountId',
        'nClientId',
        'nSupplierId',
        'cAccountType',
    ];
    protected $appends = ['display_name'];

    public function getDisplayNameAttribute()
    {
        if ($this->strAccountName) {
            return $this->strAccountName;
        }

        if ($this->relationLoaded('client') && $this->nClientId) {
            if (!$this->client) {
                return 'Receivables from (No Record)';
            }

            $name = $this->client->strClientNickName ?: $this->client->strClientName;
            $suffix = $this->isActive($this->client->cStatus, 'status_client') ? '' : ' (Inactive)';

            return 'Receivables from ' . $name . $suffix;
        }

        if ($this->relationLoaded('supplier') && $this->nSupplierId) {
            if (!$this->supplier) {
                return 'Receivables from (No Record)';
            }

            $name = $this->supplier->strSupplierNickName ?: $this->supplier->strSupplierName;
            $suffix = $this->isActive($this->supplier->cStatus, 'status_user') ? '' : ' (Inactive)';

            return 'Receivables from ' . $name . $suffix;
        }

        return '—';
    }

    /**
     * Whether a given status code matches the configured "active" status
     * for the given mapping (mirrors the convention used in the controllers,
     * where the active status is always the first key of the mapping).
     */
    private function isActive(?string $status, string $mappingKey): bool
    {
        $statusCodes = array_keys(config("mappings.{$mappingKey}", []));

        return $status !== null && $status === ($statusCodes[0] ?? null);
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'nClientId', 'nClientId');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'nSupplierId', 'nSupplierId');
    }
    public function parent()
    {
        return $this->belongsTo(JournalAccount::class, 'nParentAccountId', 'nJournalAccountId');
    }

    public function children()
    {
        return $this->hasMany(JournalAccount::class, 'nParentAccountId', 'nJournalAccountId');
    }
}