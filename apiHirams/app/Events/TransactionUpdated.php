<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // ← ShouldBroadcastNow
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionUpdated implements ShouldBroadcastNow // ← ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $action,
        public readonly int    $transactionId,
        public readonly ?array $transaction = null,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('transactions')];
    }

    public function broadcastAs(): string
    {
        return 'transaction.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action'        => $this->action,
            'transactionId' => $this->transactionId,
            'transaction'   => $this->transaction,
        ];
    }
}