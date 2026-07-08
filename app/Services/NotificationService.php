<?php

namespace App\Services;

use App\Models\Issue;
use App\Models\IssueEvent;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function notifyStatusChange(Issue $issue, IssueEvent $event): void
    {
        if (!$issue->sms_opt_in || !$issue->reporter_phone) {
            return;
        }

        $message = $this->buildMessage($issue, $event);

        $this->sendSms($issue->reporter_phone, $message);

        if ($issue->reporter_email) {
            $this->sendEmail($issue->reporter_email, $message);
        }
    }

    public function notifyCommentAdded(Issue $issue, IssueEvent $event): void
    {
        if (!$event->is_public) {
            return;
        }

        if (!$issue->sms_opt_in || !$issue->reporter_phone) {
            return;
        }

        $message = "Update on {$issue->reference_code}: {$event->description}";

        $this->sendSms($issue->reporter_phone, $message);
    }

    private function buildMessage(Issue $issue, IssueEvent $event): string
    {
        $statusLabels = [
            'received' => 'Received',
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
        ];

        $status = $statusLabels[$issue->status] ?? $issue->status;

        return "Your complaint {$issue->reference_code} status: {$status}. Track at " . route('status.check', ['code' => $issue->reference_code], false);
    }

    private function sendSms(string $phone, string $message): void
    {
        Log::info("SMS to {$phone}: {$message}");
    }

    private function sendEmail(string $email, string $message): void
    {
        Log::info("Email to {$email}: {$message}");
    }
}
