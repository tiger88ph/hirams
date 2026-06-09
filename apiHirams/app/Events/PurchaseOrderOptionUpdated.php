<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderOptionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action, // created | updated | deleted | added_to_cart
        public readonly int $purchaseOrderOptionId,
        public readonly int $purchaseOrderId,
        public readonly int $purchaseOptionId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("purchase-order.{$this->purchaseOrderId}.options"),
            new Channel('purchase-order-options'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'purchase-order-option.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'                => $this->action,
            'purchaseOrderOptionId' => $this->purchaseOrderOptionId,
            'purchaseOrderId'       => $this->purchaseOrderId,
            'purchaseOptionId'      => $this->purchaseOptionId,
        ];
    }
}