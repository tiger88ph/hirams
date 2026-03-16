<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DirectCostUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,       // 'created' | 'updated' | 'deleted'
        public readonly int    $directCostId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('direct-costs')];
    }

    public function broadcastAs(): string
    {
        return 'direct-cost.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'       => $this->action,
            'directCostId' => $this->directCostId,
        ];
    }
}