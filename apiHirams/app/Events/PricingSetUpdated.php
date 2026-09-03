<?php

namespace App\Events;

use App\Models\PricingSet;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PricingSetUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,        // 'created' | 'updated' | 'deleted' | 'chosen'
        public readonly int    $pricingSetId,
        public readonly int    $transactionId,
        public readonly ?PricingSet $pricingSet = null, // ✅ Full object (optional)
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("transaction.{$this->transactionId}.pricing-sets"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'pricing-set.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'         => $this->action,
            'pricingSetId'   => $this->pricingSetId,
            'transactionId'  => $this->transactionId,
            // ✅ Send full pricing set when available
            'pricingSet'     => $this->pricingSet ? $this->pricingSet->load('itemPricings') : null,
        ];
    }
}