<?php

namespace Tests\Unit;

use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SlaTest extends TestCase
{
    use RefreshDatabase;

    public function test_critical_priority_sla_is_4_hours(): void
    {
        $issue = Issue::factory()->create(['priority' => 'critical', 'created_at' => now()]);
        $this->assertEquals(4, $issue->created_at->diffInHours($issue->slaDeadline()));
    }

    public function test_high_priority_sla_is_24_hours(): void
    {
        $issue = Issue::factory()->create(['priority' => 'high', 'created_at' => now()]);
        $this->assertEquals(24, $issue->created_at->diffInHours($issue->slaDeadline()));
    }

    public function test_medium_priority_sla_is_72_hours(): void
    {
        $issue = Issue::factory()->create(['priority' => 'medium', 'created_at' => now()]);
        $this->assertEquals(72, $issue->created_at->diffInHours($issue->slaDeadline()));
    }

    public function test_low_priority_sla_is_168_hours(): void
    {
        $issue = Issue::factory()->create(['priority' => 'low', 'created_at' => now()]);
        $this->assertEquals(168, $issue->created_at->diffInHours($issue->slaDeadline()));
    }

    public function test_resolved_issue_is_not_sla_breached(): void
    {
        $issue = Issue::factory()->create([
            'priority' => 'critical',
            'status' => 'resolved',
            'created_at' => now()->subHours(10),
            'resolved_at' => now()->subHours(2),
        ]);
        $this->assertFalse($issue->isSlaBreached());
    }

    public function test_open_issue_past_sla_is_breached(): void
    {
        $issue = Issue::factory()->create([
            'priority' => 'critical',
            'status' => 'received',
            'created_at' => now()->subHours(10),
        ]);
        $this->assertTrue($issue->isSlaBreached());
    }

    public function test_open_issue_within_sla_is_not_breached(): void
    {
        $issue = Issue::factory()->create([
            'priority' => 'critical',
            'status' => 'received',
            'created_at' => now()->subHours(2),
        ]);
        $this->assertFalse($issue->isSlaBreached());
    }
}
