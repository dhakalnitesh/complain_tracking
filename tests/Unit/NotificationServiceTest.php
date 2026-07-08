<?php

namespace Tests\Unit;

use App\Jobs\SendNotificationJob;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new NotificationService;
    }

    public function test_send_status_change_dispatches_job_when_opted_in(): void
    {
        Queue::fake();

        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'reporter_email' => 'user@example.com',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $this->service->sendStatusChange($issue, $event);

        Queue::assertPushed(SendNotificationJob::class, function ($job) use ($issue, $event) {
            return $job->issueId === $issue->id
                && $job->eventId === $event->id
                && str_contains($job->message, $issue->reference_code);
        });
    }

    public function test_send_status_change_does_not_dispatch_when_opted_out(): void
    {
        Queue::fake();

        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'sms_opt_in' => false,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $this->service->sendStatusChange($issue, $event);

        Queue::assertNothingPushed();
    }

    public function test_send_status_change_does_not_dispatch_when_no_phone_and_no_email(): void
    {
        Queue::fake();

        $issue = Issue::factory()->create([
            'reporter_phone' => null,
            'reporter_email' => null,
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $this->service->sendStatusChange($issue, $event);

        Queue::assertNothingPushed();
    }

    public function test_send_comment_added_dispatches_job_for_public_comments(): void
    {
        Queue::fake();

        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->comment()->create([
            'issue_id' => $issue->id,
            'is_public' => true,
        ]);

        $this->service->sendCommentAdded($issue, $event);

        Queue::assertPushed(SendNotificationJob::class);
    }

    public function test_send_comment_added_skips_internal_comments(): void
    {
        Queue::fake();

        $issue = Issue::factory()->create([
            'reporter_phone' => '9812345678',
            'sms_opt_in' => true,
        ]);
        $event = IssueEvent::factory()->comment()->internal()->create([
            'issue_id' => $issue->id,
        ]);

        $this->service->sendCommentAdded($issue, $event);

        Queue::assertNothingPushed();
    }
}
