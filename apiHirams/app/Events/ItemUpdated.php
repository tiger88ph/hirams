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
        public readonly string $action,      // 'created' | 'updated' | 'deleted' | 'reordered' | 'specs_updated'
        public readonly int    $itemId,
        public readonly int    $transactionId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("transaction.{$this->transactionId}.items")];
    }

    public function broadcastAs(): string
    {
        return 'item.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'        => $this->action,
            'itemId'        => $this->itemId,
            'transactionId' => $this->transactionId,
        ];
    }
}