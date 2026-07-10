<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Upvote;
use App\Models\User;
use App\Services\MergeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MergeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_merge_duplicate_issue_into_parent(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $parent = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
        ]);
        $duplicate = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
        ]);

        $admin = User::factory()->create(['is_admin' => true]);

        $result = MergeService::merge($duplicate, $parent, $admin);

        $this->assertTrue($result);
        $duplicate->refresh();
        $this->assertEquals($parent->id, $duplicate->duplicate_of_id);
        $this->assertEquals('merged', $duplicate->status);
        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $duplicate->id,
            'type' => 'merged',
        ]);
    }

    public function test_cannot_merge_already_merged_issue(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $parent = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
        ]);
        $alreadyMerged = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'status' => 'merged',
            'duplicate_of_id' => $parent->id,
        ]);

        $admin = User::factory()->create(['is_admin' => true]);

        $result = MergeService::merge($alreadyMerged, $parent, $admin);

        $this->assertFalse($result);
    }

    public function test_cannot_merge_issue_into_itself(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
        ]);

        $admin = User::factory()->create(['is_admin' => true]);

        $result = MergeService::merge($issue, $issue, $admin);

        $this->assertFalse($result);
    }
}
