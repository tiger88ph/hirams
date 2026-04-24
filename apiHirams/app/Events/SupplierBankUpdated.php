<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupplierBankUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,   // 'created' | 'updated' | 'deleted'
        public readonly int    $bankId,
        public readonly int    $supplierId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('supplier-banks')];
    }

    public function broadcastAs(): string
    {
        return 'supplier-bank.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'     => $this->action,
            'bankId'     => $this->bankId,
            'supplierId' => $this->supplierId,
        ];
    }
}