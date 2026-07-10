<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Services\EscalationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EscalationTest extends TestCase
{
    use RefreshDatabase;

    public function test_escalates_breached_critical_issue_to_org_admin(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $admin = User::factory()->create([
            'organization_id' => $org->id,
            'is_admin' => false,
            'is_staff' => false,
        ]);
        $staff = User::factory()->create([
            'organization_id' => $org->id,
            'is_staff' => true,
        ]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'priority' => 'critical',
            'status' => 'received',
            'assigned_user_id' => $staff->id,
            'created_at' => now()->subHours(10),
        ]);

        $result = EscalationService::escalate($issue);

        $this->assertNotNull($result);
        $this->assertEquals('escalated', $result['level']);
        $this->assertArrayHasKey('new_assignee_id', $result);
        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $issue->id,
            'type' => 'escalated',
        ]);
    }

    public function test_does_not_escalate_issue_within_sla(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $staff = User::factory()->create(['organization_id' => $org->id, 'is_staff' => true]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'priority' => 'critical',
            'status' => 'received',
            'assigned_user_id' => $staff->id,
            'created_at' => now()->subHour(),
        ]);

        $result = EscalationService::escalate($issue);

        $this->assertNull($result);
    }

    public function test_does_not_escalate_resolved_issue(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $staff = User::factory()->create(['organization_id' => $org->id, 'is_staff' => true]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'priority' => 'critical',
            'status' => 'resolved',
            'assigned_user_id' => $staff->id,
            'resolved_at' => now(),
            'created_at' => now()->subHours(10),
        ]);

        $result = EscalationService::escalate($issue);

        $this->assertNull($result);
    }

    public function test_escalation_command_runs_for_all_breached_issues(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        Issue::factory()->count(3)->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'priority' => 'critical',
            'status' => 'received',
            'created_at' => now()->subHours(10),
        ]);

        $this->artisan('issues:escalate')
            ->assertExitCode(0);
    }
}
