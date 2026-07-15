<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\User;

class TransferService
{
    public static function transferToDepartment(Issue $issue, int $departmentId, User $transferredBy, string $note = ''): bool
    {
        $dept = Department::findOrFail($departmentId);

        if ($dept->organization_id !== $issue->organization_id) {
            throw new \InvalidArgumentException('Department must belong to the same organization as the issue.');
        }

        $issue->update(['department_id' => $dept->id]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => $transferredBy->id,
            'type' => 'transferred',
            'description' => $note ?: "Issue transferred to {$dept->name} department.",
            'metadata' => [
                'transfer_type' => 'department',
                'new_department_id' => $dept->id,
                'new_department_name' => $dept->name,
            ],
            'is_public' => true,
        ]);

        return true;
    }

    public static function transferToOrganization(Issue $issue, int $organizationId, int $locationId, User $transferredBy, string $note = ''): bool
    {
        $location = Location::findOrFail($locationId);
        if ($location->organization_id !== $organizationId) {
            throw new \InvalidArgumentException('Location must belong to the target organization.');
        }

        $issue->update([
            'organization_id' => $organizationId,
            'location_id' => $locationId,
            'department_id' => null,
            'assigned_user_id' => null,
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => $transferredBy->id,
            'type' => 'transferred',
            'description' => $note ?: 'Issue transferred to another organization.',
            'metadata' => [
                'transfer_type' => 'organization',
                'new_organization_id' => $organizationId,
            ],
            'is_public' => true,
        ]);

        return true;
    }
}
