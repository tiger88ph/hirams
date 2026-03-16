<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ItemPricingUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,              // 'created' | 'updated' | 'deleted' | 'bulk_saved' | 'lock_toggled'
        public readonly int    $pricingSetId,
        public readonly int    $transactionId,
        public readonly ?int   $itemPriceId = null,  // null for bulk actions
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("pricing-set.{$this->pricingSetId}.item-pricings"),
            new Channel("transaction.{$this->transactionId}.pricing-sets"),  // ← add this
        ];
    }

    public function broadcastAs(): string
    {
        return 'item-pricing.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'        => $this->action,
            'pricingSetId'  => $this->pricingSetId,
            'transactionId' => $this->transactionId,
            'itemPriceId'   => $this->itemPriceId,
        ];
    }
}
