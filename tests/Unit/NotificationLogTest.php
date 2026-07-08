<?php

namespace Tests\Unit;

use App\Models\Issue;
use App\Models\NotificationLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_belongs_to_issue(): void
    {
        $issue = Issue::factory()->create();
        $log = NotificationLog::factory()->create(['issue_id' => $issue->id]);

        $this->assertTrue($log->issue->is($issue));
    }

    public function test_pending_scope_returns_only_pending_logs(): void
    {
        NotificationLog::factory()->count(3)->create(['status' => 'pending']);
        NotificationLog::factory()->count(2)->create(['status' => 'sent']);

        $this->assertCount(3, NotificationLog::pending()->get());
    }

    public function test_sent_scope_returns_only_sent_logs(): void
    {
        NotificationLog::factory()->count(2)->create(['status' => 'sent']);
        NotificationLog::factory()->count(1)->create(['status' => 'failed']);

        $this->assertCount(2, NotificationLog::sent()->get());
    }

    public function test_failed_scope_returns_only_failed_logs(): void
    {
        NotificationLog::factory()->count(3)->create(['status' => 'failed']);
        NotificationLog::factory()->count(1)->create(['status' => 'sent']);

        $this->assertCount(3, NotificationLog::failed()->get());
    }

    public function test_recent_scope_orders_by_created_at_desc(): void
    {
        NotificationLog::factory()->create(['created_at' => now()->subDay()]);
        NotificationLog::factory()->create(['created_at' => now()]);

        $logs = NotificationLog::recent()->get();
        $this->assertTrue($logs[0]->created_at->greaterThan($logs[1]->created_at));
    }
}
