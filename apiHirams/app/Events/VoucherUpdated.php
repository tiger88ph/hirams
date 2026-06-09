<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoucherUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,     // 'created' | 'updated' | 'deleted' | 'status_changed'
        public readonly int    $voucherId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('vouchers')];
    }

    public function broadcastAs(): string
    {
        return 'voucher.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'    => $this->action,
            'voucherId' => $this->voucherId,
        ];
    }
}