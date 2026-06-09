<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoucherSupplierUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,             // 'created' | 'deleted'
        public readonly int    $voucherId,
        public readonly int    $voucherSupplierId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('vouchers')];
    }

    public function broadcastAs(): string
    {
        return 'voucher.supplier.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'            => $this->action,
            'voucherId'         => $this->voucherId,
            'voucherSupplierId' => $this->voucherSupplierId,
        ];
    }
}