<?php

namespace Tests\Unit\Channels;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Services\Channels\LogChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class LogChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_returns_success_array(): void
    {
        $issue = Issue::factory()->create(['reporter_phone' => '9812345678']);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);
        $channel = new LogChannel;

        $result = $channel->send($issue, $event, 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('logged', $result['response']);
    }

    public function test_send_logs_to_laravel_log(): void
    {
        $issue = Issue::factory()->create(['reporter_phone' => '9812345678']);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);
        $channel = new LogChannel;

        Log::shouldReceive('info')
            ->once()
            ->withArgs(fn($msg) => str_contains($msg, '9812345678') && str_contains($msg, 'Test SMS'));

        $channel->send($issue, $event, 'Test SMS');
    }
}
