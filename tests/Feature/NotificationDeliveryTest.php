<?php

namespace Tests\Feature;

use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private Issue $issue;
    private User $admin;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $org = Organization::factory()->create();
        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->staff = User::factory()->create([
            'organization_id' => $org->id,
            'is_staff' => true,
        ]);
        $this->issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'reporter_phone' => '9812345678',
            'reporter_email' => 'citizen@example.com',
            'sms_opt_in' => true,
        ]);
    }

    public function test_status_change_creates_notification_log(): void
    {
        $this->actingAs($this->admin)
            ->patch('/admin/issues/' . $this->issue->id . '/status', [
                'status' => 'in_progress',
            ]);

        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $this->issue->id,
            'status' => 'sent',
        ]);
    }

    public function test_status_change_logs_both_channels(): void
    {
        $this->actingAs($this->admin)
            ->patch('/admin/issues/' . $this->issue->id . '/status', [
                'status' => 'resolved',
            ]);

        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $this->issue->id,
            'channel' => 'log',
            'status' => 'sent',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $this->issue->id,
            'channel' => 'mail',
            'status' => 'sent',
        ]);
    }

    public function test_no_notification_log_when_sms_opt_in_false(): void
    {
        $this->issue->update(['sms_opt_in' => false, 'reporter_phone' => null]);

        $this->actingAs($this->admin)
            ->patch('/admin/issues/' . $this->issue->id . '/status', [
                'status' => 'resolved',
            ]);

        $this->assertDatabaseMissing('notification_logs', [
            'issue_id' => $this->issue->id,
        ]);
    }

    public function test_comment_added_creates_notification_log(): void
    {
        $this->issue->update(['assigned_user_id' => $this->staff->id]);

        $this->actingAs($this->staff)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => 'We are inspecting this site.',
                'is_public' => true,
            ]);

        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $this->issue->id,
            'status' => 'sent',
        ]);
    }

    public function test_internal_comment_does_not_create_notification_log(): void
    {
        $this->issue->update(['assigned_user_id' => $this->staff->id]);

        $this->actingAs($this->staff)
            ->post('/staff/issues/' . $this->issue->id . '/comment', [
                'comment' => 'Internal note only.',
                'is_public' => false,
            ]);

        $this->assertDatabaseMissing('notification_logs', [
            'issue_id' => $this->issue->id,
        ]);
    }
}
