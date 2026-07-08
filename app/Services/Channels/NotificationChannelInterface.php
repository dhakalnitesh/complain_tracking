<?php

namespace App\Services\Channels;

use App\Models\Issue;
use App\Models\IssueEvent;

interface NotificationChannelInterface
{
    /**
     * Send a notification through this channel.
     *
     * @return array{success: bool, response: string}
     */
    public function send(Issue $issue, IssueEvent $event, string $message): array;
}
