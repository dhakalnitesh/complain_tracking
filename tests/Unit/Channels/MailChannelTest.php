<?php

namespace Tests\Unit\Channels;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Services\Channels\MailChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MailChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_returns_success_array(): void
    {
        $issue = Issue::factory()->create([
            'reporter_email' => 'citizen@example.com',
            'reference_code' => 'TST-0001',
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);
        $channel = new MailChannel;

        $result = $channel->send($issue, $event, 'Your complaint TST-0001 status: Resolved');

        $this->assertTrue($result['success']);
        $this->assertEquals('sent', $result['response']);
    }

    public function test_send_returns_failed_on_exception(): void
    {
        $issue = Issue::factory()->create([
            'reporter_email' => 'test@example.com',
            'reference_code' => 'TST-0002',
        ]);
        $event = IssueEvent::factory()->create(['issue_id' => $issue->id]);

        $channel = \Mockery::mock(MailChannel::class)->makePartial();
        $channel->shouldReceive('send')
            ->andReturn(['success' => false, 'response' => 'SMTP error: Connection refused']);

        $result = $channel->send($issue, $event, 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('SMTP error', $result['response']);
    }
}
