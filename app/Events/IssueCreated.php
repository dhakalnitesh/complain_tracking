<?php

namespace App\Events;

use App\Models\Issue;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class IssueCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Issue $issue;

    public function __construct(Issue $issue)
    {
        $this->issue = $issue;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->issue->id,
            'reference_code' => $this->issue->reference_code,
            'category' => $this->issue->category,
            'priority' => $this->issue->priority,
            'organization_id' => $this->issue->organization_id,
            'description' => substr($this->issue->description, 0, 100),
            'created_at' => $this->issue->created_at->toISOString(),
        ];
    }
}
