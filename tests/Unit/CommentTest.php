<?php

namespace Tests\Unit;

use App\Models\Comment;
use App\Models\Issue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_comment_belongs_to_issue(): void
    {
        $issue = Issue::factory()->create();
        $comment = Comment::factory()->create(['issue_id' => $issue->id]);

        $this->assertTrue($comment->issue->is($issue));
    }

    public function test_comment_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($comment->user->is($user));
    }

    public function test_comment_has_replies(): void
    {
        $comment = Comment::factory()->create();
        $reply = Comment::factory()->create(['parent_id' => $comment->id]);

        $this->assertTrue($comment->replies->contains($reply));
        $this->assertEquals($comment->id, $reply->parent_id);
    }

    public function test_author_name_returns_user_name(): void
    {
        $user = User::factory()->create(['name' => 'Ram Sharma']);
        $comment = Comment::factory()->create(['user_id' => $user->id]);

        $this->assertEquals('Ram Sharma', $comment->authorName());
    }

    public function test_author_name_returns_anonymous_for_session(): void
    {
        $comment = Comment::factory()->create(['user_id' => null, 'session_id' => 'sess-1']);

        $this->assertEquals('Anonymous', $comment->authorName());
    }
}
