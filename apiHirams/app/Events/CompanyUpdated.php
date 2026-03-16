<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,  // 'created' | 'updated' | 'deleted'
        public readonly int    $companyId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('companies')];
    }

    public function broadcastAs(): string
    {
        return 'company.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'    => $this->action,
            'companyId' => $this->companyId,
        ];
    }
}