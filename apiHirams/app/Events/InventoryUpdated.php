<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public int $nInventoryId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $action, int $nInventoryId)
    {
        $this->action = $action;
        $this->nInventoryId = $nInventoryId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('inventory'),
        ];
    }
public function broadcastWith(): array
{
    return [
        'action'      => $this->action,
        'inventoryId' => $this->nInventoryId,
    ];
}
    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'inventory.updated';
    }
}