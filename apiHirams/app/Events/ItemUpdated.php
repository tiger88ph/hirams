<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ItemUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,
        public readonly int    $itemId,           // nTransactionItemId
        public readonly int    $transactionId,
    ) {}

    // ✅ Broadcast to GLOBAL channel — matches frontend exactly
    public function broadcastOn(): array
    {
        return [new Channel('transaction_items')];
    }

    // ✅ Event name — matches frontend ".transaction_item.updated"
    public function broadcastAs(): string
    {
        return 'transaction_item.updated';
    }

    // ✅ Data shape — matches frontend expectations
    public function broadcastWith(): array
    {
        return [
            'action'              => $this->action,
            'itemId'              => $this->itemId,
            'transactionItemId'   => $this->itemId,     // ← Alias for frontend compatibility
            'transactionId'       => $this->transactionId,
        ];
    }
}