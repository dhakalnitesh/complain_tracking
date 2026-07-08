<?php

namespace App\Events;

use App\Models\IssueEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class IssueCommentAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public IssueEvent $event;

    public function __construct(IssueEvent $event)
    {
        $this->event = $event;
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
            'issue_id' => $this->event->issue_id,
            'event_id' => $this->event->id,
            'description' => substr($this->event->description, 0, 100),
            'is_public' => $this->event->is_public,
        ];
    }
}
