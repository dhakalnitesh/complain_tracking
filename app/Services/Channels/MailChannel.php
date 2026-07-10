<?php

namespace App\Services\Channels;

use App\Models\Issue;
use App\Models\IssueEvent;
use Illuminate\Support\Facades\Mail;

class MailChannel implements NotificationChannelInterface
{
    public function send(Issue $issue, ?IssueEvent $event, string $message): array
    {
        try {
            Mail::raw($message, function ($msg) use ($issue) {
                $msg->to($issue->reporter_email)
                    ->subject("Complaint Update: {$issue->reference_code}");
            });

            return [
                'success' => true,
                'response' => 'sent',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'response' => $e->getMessage(),
            ];
        }
    }
}
