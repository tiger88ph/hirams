<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JournalEntryUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,     // 'created' | 'updated' | 'deleted'
        public readonly int    $jevEntryId,
        public readonly int    $jevId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('jev-entries')];
    }

    public function broadcastAs(): string
    {
        return 'jev-entry.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'     => $this->action,
            'jevEntryId' => $this->jevEntryId,
            'jevId'      => $this->jevId,
        ];
    }
}
