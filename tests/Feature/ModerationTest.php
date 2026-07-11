<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Flag;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Services\AbuseDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_flag_an_issue(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);

        $response = $this->post("/issues/{$issue->id}/flag", [
            'reason' => 'spam',
            'description' => 'This complaint is spam',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('flags', [
            'flaggable_type' => Issue::class,
            'flaggable_id' => $issue->id,
            'reason' => 'spam',
        ]);
    }

    public function test_user_can_flag_a_comment(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $comment = Comment::factory()->create(['issue_id' => $issue->id]);

        $response = $this->post("/comments/{$comment->id}/flag", [
            'reason' => 'harassment',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('flags', [
            'flaggable_type' => Comment::class,
            'flaggable_id' => $comment->id,
            'reason' => 'harassment',
        ]);
    }

    public function test_admin_can_view_moderation_queue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $admin->id, 'reason' => 'spam', 'status' => 'pending']);

        $response = $this->actingAs($admin)->get('/admin/moderation');

        $response->assertStatus(200);
        $response->assertSee('spam');
    }

    public function test_admin_can_dismiss_flag(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $flag = Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $admin->id, 'reason' => 'spam', 'status' => 'pending']);

        $response = $this->actingAs($admin)->post("/admin/moderation/{$flag->id}/dismiss");

        $response->assertStatus(302);
        $flag->refresh();
        $this->assertEquals('dismissed', $flag->status);
    }

    public function test_admin_can_hide_flagged_content(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $issue = Issue::factory()->create(['organization_id' => $org->id, 'location_id' => $location->id]);
        $flag = Flag::create(['flaggable_type' => Issue::class, 'flaggable_id' => $issue->id, 'user_id' => $admin->id, 'reason' => 'spam', 'status' => 'pending']);

        $response = $this->actingAs($admin)->post("/admin/moderation/{$flag->id}/hide");

        $response->assertStatus(302);
        $issue->refresh();
        $this->assertNotNull($issue->hidden_at);
    }

    public function test_abuse_detection_flags_high_frequency_reporter(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        for ($i = 0; $i < 12; $i++) {
            Issue::factory()->create([
                'organization_id' => $org->id,
                'location_id' => $location->id,
                'reporter_phone' => '9812345678',
                'created_at' => now(),
            ]);
        }

        $result = AbuseDetectionService::check('Some complaint description for testing', '9812345678');

        $this->assertGreaterThan(0, $result['spam_score']);
        $this->assertContains('High volume from this phone number', $result['reasons']);
    }

    public function test_abuse_detection_does_not_flag_normal_user(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'reporter_phone' => '9812345678',
        ]);

        $result = AbuseDetectionService::check('Normal complaint description for testing', '9812345678');

        $this->assertEquals(0, $result['spam_score']);
    }

    public function test_abuse_detection_flags_spammy_description(): void
    {
        $spammy = 'BUY NOW!!! 😀😀😀😀😀😀 Check this https://spam.com and https://scam.net and https://evil.org and https://phish.com and https://malware.net and https://tracker.org for cheap cheap cheap deals 9812345678 9800000000 9811111111';

        $result = AbuseDetectionService::check($spammy);

        $this->assertGreaterThan(0.7, $result['spam_score']);
        $this->assertContains('Contains 6 URLs', $result['reasons']);
    }
}
