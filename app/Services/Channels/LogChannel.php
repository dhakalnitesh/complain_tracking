<?php

namespace App\Services\Channels;

use App\Models\Issue;
use App\Models\IssueEvent;
use Illuminate\Support\Facades\Log;

class LogChannel implements NotificationChannelInterface
{
    public function send(Issue $issue, IssueEvent $event, string $message): array
    {
        Log::info("SMS to {$issue->reporter_phone}: {$message}");

        return [
            'success' => true,
            'response' => 'logged',
        ];
    }
}
