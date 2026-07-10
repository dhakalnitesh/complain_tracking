<?php

namespace App\Jobs;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\NotificationLog;
use App\Services\Channels\LogChannel;
use App\Services\Channels\MailChannel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class SendNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $issueId,
        public int $eventId,
        public string $message,
    ) {}

    public function handle(): void
    {
        $issue = Issue::withTrashed()->findOrFail($this->issueId);
        $event = $this->eventId > 0 ? IssueEvent::find($this->eventId) : null;

        if ($issue->reporter_phone && $issue->sms_opt_in) {
            $channel = app(LogChannel::class);
            $result = $channel->send($issue, $event, $this->message);
            $this->logDelivery($issue, $event, 'log', $issue->reporter_phone, $result);
        }

        if ($issue->reporter_email) {
            $channel = app(MailChannel::class);
            $result = $channel->send($issue, $event, $this->message);
            $this->logDelivery($issue, $event, 'mail', $issue->reporter_email, $result);
        }

        Cache::forget('notifications.stats.' . date('Y-m-d'));
    }

    private function logDelivery(
        Issue $issue,
        ?IssueEvent $event,
        string $channel,
        string $recipient,
        array $result,
    ): void {
        NotificationLog::create([
            'issue_id' => $issue->id,
            'issue_event_id' => $event?->id,
            'channel' => $channel,
            'recipient' => $recipient,
            'message' => $this->message,
            'status' => $result['success'] ? 'sent' : 'failed',
            'response' => $result['response'] ?? null,
            'delivered_at' => $result['success'] ? now() : null,
        ]);
    }
}
