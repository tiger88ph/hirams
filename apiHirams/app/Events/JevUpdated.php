<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// The JEV row itself (not one of its lines — that is JournalEntryUpdated).
// The sidebar badges are a straight COUNT(*) per cJEVLinkType, so a JEV
// created, retyped or deleted on one tab/user has to be able to recount
// them everywhere instead of everyone waiting for a page navigation.
class JevUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,   // 'created' | 'updated' | 'deleted'
        public readonly int    $jevId,
        public readonly string $linkType = '',  // cJEVLinkType — whose badge moves
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('jevs')];
    }

    public function broadcastAs(): string
    {
        return 'jev.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'   => $this->action,
            'jevId'    => $this->jevId,
            'linkType' => $this->linkType,
        ];
    }
}
