<?php

namespace Tests\Feature;

use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IssueAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $staff;
    private Issue $issue;

    protected function setUp(): void
    {
        parent::setUp();

        $org = Organization::factory()->create();
        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $org->id,
        ]);
        $this->issue = Issue::factory()->create([
            'organization_id' => $org->id,
        ]);
    }

    public function test_admin_can_assign_issue_to_staff_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.issues.assign', $this->issue), [
                'assigned_to' => $this->staff->name,
                'assigned_user_id' => $this->staff->id,
            ]);

        $response->assertRedirect();
        $this->issue->refresh();

        $this->assertEquals($this->staff->name, $this->issue->assigned_to);
        $this->assertEquals($this->staff->id, $this->issue->assigned_user_id);
    }

    public function test_assigning_creates_issue_event(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.issues.assign', $this->issue), [
                'assigned_to' => $this->staff->name,
                'assigned_user_id' => $this->staff->id,
            ]);

        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $this->issue->id,
            'type' => 'assigned',
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_admin_cannot_assign_to_non_staff_user(): void
    {
        $nonStaff = User::factory()->create(['is_staff' => false]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.issues.assign', $this->issue), [
                'assigned_to' => $nonStaff->name,
                'assigned_user_id' => $nonStaff->id,
            ]);

        $response->assertSessionHasErrors('assigned_user_id');
    }

    public function test_admin_issues_show_assigned_user(): void
    {
        $this->issue->update([
            'assigned_to' => $this->staff->name,
            'assigned_user_id' => $this->staff->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->get('/admin/dashboard');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.total_issues', 1)
        );
    }
}
