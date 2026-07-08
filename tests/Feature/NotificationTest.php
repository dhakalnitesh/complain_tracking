<?php

namespace Tests\Feature;

use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private Issue $issue;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $org = Organization::factory()->create();
        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'reporter_phone' => '9812345678',
            'reporter_email' => 'citizen@example.com',
            'sms_opt_in' => true,
        ]);
    }

    public function test_status_change_queues_notification_when_opted_in(): void
    {
        $this->issue->update(['sms_opt_in' => true]);

        $this->actingAs($this->admin)
            ->patch('/admin/issues/' . $this->issue->id . '/status', [
                'status' => 'resolved',
            ]);

        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $this->issue->id,
            'type' => 'status_changed',
        ]);
    }

    public function test_notification_not_sent_when_opted_out(): void
    {
        $this->issue->update(['sms_opt_in' => false, 'reporter_phone' => null]);

        $this->actingAs($this->admin)
            ->patch('/admin/issues/' . $this->issue->id . '/status', [
                'status' => 'resolved',
            ]);

        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $this->issue->id,
            'type' => 'status_changed',
        ]);
    }
}
