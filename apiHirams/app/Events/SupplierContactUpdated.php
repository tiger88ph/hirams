<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupplierContactUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,    // 'created' | 'updated' | 'deleted'
        public readonly int    $contactId,
        public readonly int    $supplierId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('supplier-contacts')];
    }

    public function broadcastAs(): string
    {
        return 'supplier-contact.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'     => $this->action,
            'contactId'  => $this->contactId,
            'supplierId' => $this->supplierId,
        ];
    }
}