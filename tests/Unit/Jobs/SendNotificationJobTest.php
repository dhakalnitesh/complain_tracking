<?php

namespace Tests\Unit\Jobs;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\NotificationLog;
use App\Jobs\SendNotificationJob;
use App\Services\Channels\LogChannel;
use App\Services\Channels\MailChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SendNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_handle_sends_via_log_channel_when_phone_exists(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'reporter_email' => null,
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $issue->id,
            'channel' => 'log',
            'recipient' => '9812345678',
            'status' => 'sent',
        ]);
    }

    public function test_handle_sends_via_mail_channel_when_email_exists(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => null,
            'reporter_email' => 'user@example.com',
            'sms_opt_in' => false,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseHas('notification_logs', [
            'issue_id' => $issue->id,
            'channel' => 'mail',
            'recipient' => 'user@example.com',
            'status' => 'sent',
        ]);
    }

    public function test_handle_sends_via_both_channels_when_both_exist(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'reporter_email' => 'user@example.com',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseHas('notification_logs', ['issue_id' => $issue->id, 'channel' => 'log', 'status' => 'sent']);
        $this->assertDatabaseHas('notification_logs', ['issue_id' => $issue->id, 'channel' => 'mail', 'status' => 'sent']);
    }

    public function test_handle_skips_log_channel_when_sms_opt_in_is_false(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'reporter_email' => null,
            'sms_opt_in' => false,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseMissing('notification_logs', [
            'issue_id' => $issue->id,
            'channel' => 'log',
        ]);
    }

    public function test_handle_skips_log_channel_when_no_phone(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => null,
            'reporter_email' => 'user@example.com',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseMissing('notification_logs', [
            'issue_id' => $issue->id,
            'channel' => 'log',
        ]);
    }

    public function test_handle_skips_mail_channel_when_no_email(): void
    {
        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'reporter_email' => null,
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertDatabaseMissing('notification_logs', [
            'issue_id' => $issue->id,
            'channel' => 'mail',
        ]);
    }

    public function test_handle_invalidates_cache(): void
    {
        Cache::put('notifications.stats.' . date('Y-m-d'), ['sent' => 5], 300);

        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $job = new SendNotificationJob($issue->id, $event->id, 'Test message');
        $job->handle();

        $this->assertNull(Cache::get('notifications.stats.' . date('Y-m-d')));
    }
}
