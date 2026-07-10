<?php

namespace Tests\Unit;

use App\Models\Comment;
use App\Models\Flag;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_flag_belongs_to_issue(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $user = User::factory()->create();

        $flag = Flag::create([
            'flaggable_type' => Issue::class,
            'flaggable_id' => $issue->id,
            'user_id' => $user->id,
            'reason' => 'spam',
            'description' => 'This is spam',
        ]);

        $this->assertInstanceOf(Issue::class, $flag->flaggable);
        $this->assertEquals($issue->id, $flag->flaggable->id);
    }

    public function test_flag_belongs_to_comment(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $user = User::factory()->create();
        $comment = Comment::factory()->create(['issue_id' => $issue->id]);

        $flag = Flag::create([
            'flaggable_type' => Comment::class,
            'flaggable_id' => $comment->id,
            'user_id' => $user->id,
            'reason' => 'harassment',
        ]);

        $this->assertInstanceOf(Comment::class, $flag->flaggable);
        $this->assertEquals($comment->id, $flag->flaggable->id);
    }

    public function test_pending_scope_returns_only_pending_flags(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $user = User::factory()->create();

        Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $user->id, 'reason' => 'spam', 'status' => 'pending']);
        Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $user->id, 'reason' => 'spam', 'status' => 'reviewed']);
        Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $user->id, 'reason' => 'spam', 'status' => 'dismissed']);

        $this->assertEquals(1, Flag::pending()->count());
    }
}
