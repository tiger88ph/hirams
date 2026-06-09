<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action, // created | updated | deleted | status_updated | payment_updated
        public readonly int $purchaseOrderId,
        public readonly ?string $newStatus = null, // ← ADD
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('purchase-orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'purchase-order.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'          => $this->action,
            'purchaseOrderId' => $this->purchaseOrderId,
            'newStatus'       => $this->newStatus, // ← ADD
        ];
    }
}