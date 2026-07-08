<?php

namespace Tests\Feature;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    private Issue $issue;
    private User $staff;
    private User $admin;

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
        $this->issue->events()->create([
            'type' => 'created',
            'description' => 'Issue submitted',
        ]);
    }

    public function test_staff_can_add_public_comment(): void
    {
        $response = $this->actingAs($this->staff)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => 'Team has been dispatched to inspect the site.',
                'is_public' => true,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $this->issue->id,
            'type' => 'commented',
            'description' => 'Team has been dispatched to inspect the site.',
            'is_public' => true,
            'user_id' => $this->staff->id,
        ]);
    }

    public function test_staff_can_add_internal_note(): void
    {
        $response = $this->actingAs($this->staff)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => 'Need to follow up with department head',
                'is_public' => false,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $this->issue->id,
            'type' => 'commented',
            'description' => 'Need to follow up with department head',
            'is_public' => false,
        ]);
    }

    public function test_public_user_sees_only_public_events(): void
    {
        $this->issue->events()->create([
            'type' => 'commented',
            'description' => 'Public update: inspection done',
            'is_public' => true,
        ]);
        $this->issue->events()->create([
            'type' => 'commented',
            'description' => 'Internal note: staff meeting',
            'is_public' => false,
        ]);

        $response = $this->get('/issues/reference/' . $this->issue->reference_code);

        $response->assertOk();
        $response->assertSee('Public update: inspection done');
        $response->assertDontSee('Internal note: staff meeting');
    }

    public function test_comment_requires_text(): void
    {
        $response = $this->actingAs($this->staff)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => '',
                'is_public' => true,
            ]);

        $response->assertSessionHasErrors('comment');
    }

    public function test_non_staff_cannot_comment(): void
    {
        $user = User::factory()->create(['is_staff' => false, 'is_admin' => false]);

        $response = $this->actingAs($user)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => 'Test comment',
                'is_public' => true,
            ]);

        $response->assertForbidden();
    }

    public function test_comment_shows_on_status_track(): void
    {
        $this->issue->events()->create([
            'type' => 'commented',
            'description' => 'Work in progress, expected completion tomorrow',
            'is_public' => true,
        ]);

        $response = $this->get('/status?code=' . $this->issue->reference_code);

        $response->assertOk();
        $response->assertSee('Work in progress');
    }
}
