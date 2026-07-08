<?php

namespace App\Events;

use App\Models\Issue;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class IssueStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Issue $issue;
    public string $oldStatus;

    public function __construct(Issue $issue, string $oldStatus)
    {
        $this->issue = $issue;
        $this->oldStatus = $oldStatus;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('admin'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->issue->id,
            'reference_code' => $this->issue->reference_code,
            'status' => $this->issue->status,
            'old_status' => $this->oldStatus,
        ];
    }
}
