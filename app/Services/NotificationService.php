<?php

namespace App\Services;

use App\Jobs\SendNotificationJob;
use App\Models\Issue;
use App\Models\IssueEvent;

class NotificationService
{
    public function sendIssueCreated(Issue $issue, ?IssueEvent $event = null): void
    {
        if (!$issue->reporter_email) {
            return;
        }

        $message = $this->buildIssueCreatedMessage($issue);

        SendNotificationJob::dispatch($issue->id, $event?->id ?? 0, $message);
    }

    public function sendStatusChange(Issue $issue, IssueEvent $event): void
    {
        if (!$this->shouldNotify($issue)) {
            return;
        }

        $message = $this->buildStatusMessage($issue);

        SendNotificationJob::dispatch($issue->id, $event->id, $message);
    }

    public function sendCommentAdded(Issue $issue, IssueEvent $event): void
    {
        if (!$event->is_public) {
            return;
        }

        if (!$this->shouldNotify($issue)) {
            return;
        }

        $message = $this->buildCommentMessage($issue, $event);

        SendNotificationJob::dispatch($issue->id, $event->id, $message);
    }

    private function shouldNotify(Issue $issue): bool
    {
        if (!$issue->sms_opt_in) {
            return false;
        }

        return $issue->reporter_phone || $issue->reporter_email;
    }

    private function buildIssueCreatedMessage(Issue $issue): string
    {
        $template = config('notifications.templates.issue_created');

        return str_replace(
            [':reference_code', ':track_url', ':description'],
            [$issue->reference_code, route('issues.show-reference', $issue->reference_code), substr($issue->description, 0, 100)],
            $template,
        );
    }

    private function buildStatusMessage(Issue $issue): string
    {
        $statusLabels = [
            'received' => 'Received',
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
        ];

        $status = $statusLabels[$issue->status] ?? $issue->status;
        $template = config('notifications.templates.status_change');

        return str_replace(
            [':reference_code', ':status', ':track_url'],
            [$issue->reference_code, $status, route('issues.show-reference', $issue->reference_code)],
            $template,
        );
    }

    private function buildCommentMessage(Issue $issue, IssueEvent $event): string
    {
        $template = config('notifications.templates.comment_added');

        return str_replace(
            [':reference_code', ':comment'],
            [$issue->reference_code, $event->description],
            $template,
        );
    }
}
