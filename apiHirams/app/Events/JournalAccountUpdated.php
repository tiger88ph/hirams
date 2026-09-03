<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JournalAccountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,          // 'created' | 'updated' | 'deleted'
        public readonly int    $journalAccountId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('journal-accounts')];
    }

    public function broadcastAs(): string
    {
        return 'journal-account.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'           => $this->action,
            'journalAccountId' => $this->journalAccountId,
        ];
    }
}