<?php

namespace App\Services;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\User;

class EscalationService
{
    public static function escalate(Issue $issue): ?array
    {
        if ($issue->status === 'resolved' || $issue->status === 'merged') {
            return null;
        }

        if (!$issue->isSlaBreached()) {
            return null;
        }

        if ($issue->events()->where('type', 'escalated')->exists()) {
            return null;
        }

        $orgId = $issue->organization_id;
        $orgAdmin = User::where('organization_id', $orgId)
            ->where('is_staff', false)
            ->where(function ($q) {
                $q->whereNull('is_admin')->orWhere('is_admin', false);
            })
            ->first();

        if (!$orgAdmin) {
            $orgAdmin = User::where('is_admin', true)->first();
        }

        $previousAssigneeId = $issue->assigned_user_id;

        if ($orgAdmin) {
            $issue->update(['assigned_user_id' => $orgAdmin->id]);
        }

        $event = IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => $orgAdmin?->id,
            'type' => 'escalated',
            'description' => "Issue auto-escalated due to SLA breach. Priority: {$issue->priority}, breached after " . config("sla.priorities.{$issue->priority}.hours") . ' hours.',
            'metadata' => [
                'escalation_level' => $orgAdmin ? 1 : 0,
                'previous_assignee_id' => $previousAssigneeId,
                'new_assignee_id' => $orgAdmin?->id,
                'priority' => $issue->priority,
                'sla_hours' => config("sla.priorities.{$issue->priority}.hours"),
            ],
            'is_public' => true,
        ]);

        return [
            'level' => 'escalated',
            'new_assignee_id' => $orgAdmin?->id,
            'event_id' => $event->id,
        ];
    }
}
