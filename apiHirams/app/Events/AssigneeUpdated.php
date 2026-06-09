<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssigneeUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,     // 'created' | 'updated' | 'deleted' | 'status_changed'
        public readonly int    $assigneeId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('assignees')];
    }

    public function broadcastAs(): string
    {
        return 'assignee.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'     => $this->action,
            'assigneeId' => $this->assigneeId,
        ];
    }
}