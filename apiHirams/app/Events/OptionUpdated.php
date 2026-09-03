<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OptionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,          // 'created' | 'updated' | 'deleted' | 'specs_updated'
        public readonly int    $optionId,
        public readonly int    $itemId,
        public readonly int    $transactionId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            // ✅ Transaction-specific channel — matches frontend listener
            new Channel("transaction.{$this->transactionId}.items"),
            // ✅ Global channel for cross-transaction listeners
            new Channel("transactions"),
        ];
    }

    public function broadcastAs(): string
    {
        // ✅ Matches frontend: ".option.updated"
        return 'option.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'        => $this->action,
            'optionId'      => $this->optionId,
            'itemId'        => $this->itemId,
            'transactionId' => $this->transactionId,
        ];
    }
}