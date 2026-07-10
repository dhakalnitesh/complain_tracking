<?php

namespace Tests\Unit;

use App\Models\Issue;
use App\Models\Upvote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpvoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upvote_issue(): void
    {
        $user = User::factory()->create();
        $issue = Issue::factory()->create();

        $result = Upvote::toggle($issue->id, $user->id, null);

        $this->assertTrue($result['upvoted']);
        $this->assertEquals(1, $result['count']);
        $this->assertDatabaseHas('upvotes', ['issue_id' => $issue->id, 'user_id' => $user->id]);
    }

    public function test_user_can_remove_upvote(): void
    {
        $user = User::factory()->create();
        $issue = Issue::factory()->create();

        Upvote::create(['issue_id' => $issue->id, 'user_id' => $user->id]);
        $result = Upvote::toggle($issue->id, $user->id, null);

        $this->assertFalse($result['upvoted']);
        $this->assertEquals(0, $result['count']);
        $this->assertDatabaseMissing('upvotes', ['issue_id' => $issue->id, 'user_id' => $user->id]);
    }

    public function test_session_can_upvote_issue(): void
    {
        $issue = Issue::factory()->create();
        $sessionId = 'test-session-123';

        $result = Upvote::toggle($issue->id, null, $sessionId);

        $this->assertTrue($result['upvoted']);
        $this->assertEquals(1, $result['count']);
        $this->assertDatabaseHas('upvotes', ['issue_id' => $issue->id, 'session_id' => $sessionId]);
    }

    public function test_upvote_count_is_accurate(): void
    {
        $issue = Issue::factory()->create();

        Upvote::create(['issue_id' => $issue->id, 'session_id' => 'session-1']);
        Upvote::create(['issue_id' => $issue->id, 'session_id' => 'session-2']);
        Upvote::create(['issue_id' => $issue->id, 'session_id' => 'session-3']);

        $this->assertEquals(3, Upvote::where('issue_id', $issue->id)->count());
    }

    public function test_has_upvoted_checks_correctly(): void
    {
        $issue = Issue::factory()->create();
        $user = User::factory()->create();

        Upvote::create(['issue_id' => $issue->id, 'user_id' => $user->id]);

        $this->assertTrue(Upvote::hasUpvoted($issue->id, $user->id, null));
        $this->assertFalse(Upvote::hasUpvoted($issue->id, null, 'other-session'));
    }
}
