<?php

namespace Tests\Feature;

use App\Events\IssueCommentAdded;
use App\Events\IssueCreated;
use App\Events\IssueStatusChanged;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_issue_created_uses_private_channel(): void
    {
        $org = Organization::factory()->create();
        $issue = Issue::factory()->create(['organization_id' => $org->id]);
        $event = new IssueCreated($issue);

        $channels = $event->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertEquals('private-admin', $channels[0]->name);
    }

    public function test_issue_status_changed_uses_private_channel(): void
    {
        $org = Organization::factory()->create();
        $issue = Issue::factory()->create(['organization_id' => $org->id]);
        $event = new IssueStatusChanged($issue, 'received');

        $channels = $event->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
    }

    public function test_issue_created_dispatched_on_submit(): void
    {
        Event::fake();

        $org = Organization::factory()->create();
        $location = \App\Models\Location::factory()->create(['organization_id' => $org->id, 'name' => 'Test']);

        $category = \App\Models\Category::create(['name' => 'Test Cat', 'slug' => 'test-cat', 'is_active' => true, 'sort_order' => 1]);
        $this->assertNotNull($category->slug, 'Slug should be auto-generated');

        $this->post('/issues', [
            'organization_id' => $org->id,
            'category_id' => $category->id,
            'priority' => 'low',
            'location_id' => $location->id,
            'description' => 'Test issue for broadcast',
        ]);

        Event::assertDispatched(IssueCreated::class);
    }

    public function test_comment_added_uses_private_channel(): void
    {
        $org = Organization::factory()->create();
        $issue = Issue::factory()->create(['organization_id' => $org->id]);
        $event = $issue->events()->create([
            'type' => 'commented',
            'description' => 'Test comment',
            'is_public' => true,
        ]);
        $broadcastEvent = new IssueCommentAdded($event);

        $channels = $broadcastEvent->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
    }
}
