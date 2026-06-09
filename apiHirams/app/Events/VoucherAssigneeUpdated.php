<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoucherAssigneeUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,              // 'created' | 'updated' | 'deleted'
        public readonly int    $voucherId,
        public readonly int    $voucherAssigneeId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('vouchers')];
    }

    public function broadcastAs(): string
    {
        return 'voucher.assignee.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'             => $this->action,
            'voucherId'          => $this->voucherId,
            'voucherAssigneeId'  => $this->voucherAssigneeId,
        ];
    }
}