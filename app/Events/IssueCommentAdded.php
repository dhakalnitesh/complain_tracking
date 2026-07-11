<?php

namespace App\Events;

use App\Models\IssueEvent;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class IssueCommentAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public IssueEvent $event;
    public int $organizationId;

    public function __construct(IssueEvent $event, int $organizationId)
    {
        $this->event = $event;
        $this->organizationId = $organizationId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.' . $this->organizationId),
            new PrivateChannel('admin.global'),
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
