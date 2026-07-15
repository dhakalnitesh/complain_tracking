<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoUploadTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;
    private Location $location;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->org = Organization::factory()->create();
        $this->location = Location::factory()->create(['organization_id' => $this->org->id]);
        $this->category = Category::factory()->create();
    }

    public function test_video_upload_succeeds_with_valid_video(): void
    {
        $video = UploadedFile::fake()->create('complaint.mp4', 2048, 'video/mp4');

        $response = $this->post('/issues', [
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'priority' => 'medium',
            'location_id' => $this->location->id,
            'title' => 'Video test complaint',
            'description' => 'Test complaint with video attachment',
            'video' => $video,
            'website' => '',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('issues', [
            'description' => 'Test complaint with video attachment',
        ]);

        $issue = \App\Models\Issue::where('description', 'Test complaint with video attachment')->first();
        $this->assertNotNull($issue->video_path);
        $this->assertStringContainsString('issue-videos/', $issue->video_path);
        $this->assertTrue(\Illuminate\Support\Facades\Storage::disk('public')->exists($issue->video_path));
    }

    public function test_controller_accepts_both_photo_and_video(): void
    {
        $video = UploadedFile::fake()->create('clip.webm', 1024, 'video/webm');

        $response = $this->post('/issues', [
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'priority' => 'low',
            'location_id' => $this->location->id,
            'title' => 'Both media test',
            'description' => 'Testing both media',
            'video' => $video,
            'photo' => UploadedFile::fake()->image('photo.jpg', 100, 100),
            'website' => '',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $issue = \App\Models\Issue::where('description', 'Testing both media')->first();
        $this->assertNotNull($issue->video_path);
        $this->assertNotNull($issue->photo_path);
    }

    public function test_video_rejects_invalid_mime_type(): void
    {
        $notVideo = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

        $response = $this->post('/issues', [
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'priority' => 'medium',
            'location_id' => $this->location->id,
            'description' => 'Should fail with PDF',
            'video' => $notVideo,
            'website' => '',
        ]);

        $response->assertSessionHasErrors('video');
    }

    public function test_video_rejects_oversized_file(): void
    {
        $hugeVideo = UploadedFile::fake()->create('huge.mp4', 60000, 'video/mp4');

        $response = $this->post('/issues', [
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'priority' => 'high',
            'location_id' => $this->location->id,
            'description' => 'Should fail with huge video',
            'video' => $hugeVideo,
            'website' => '',
        ]);

        $response->assertSessionHasErrors('video');
    }

    public function test_video_optional_photo_and_video_both_null(): void
    {
        $response = $this->post('/issues', [
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'priority' => 'low',
            'location_id' => $this->location->id,
            'title' => 'No media test',
            'description' => 'No media at all',
            'website' => '',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $issue = \App\Models\Issue::where('description', 'No media at all')->first();
        $this->assertNull($issue->video_path);
        $this->assertNull($issue->photo_path);
        $this->assertFalse($issue->has_video);
        $this->assertFalse($issue->has_photo);
    }

    public function test_video_controller_serves_video_by_reference_code(): void
    {
        $issue = \App\Models\Issue::factory()->create([
            'video_path' => 'issue-videos/test_video.mp4',
        ]);

        Storage::disk('public')->put('issue-videos/test_video.mp4', 'fake-video-content');

        $response = $this->get('/issues/video/' . $issue->reference_code);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'video/mp4');
    }

    public function test_photo_controller_serves_photo_over_video_when_both_exist(): void
    {
        $issue = \App\Models\Issue::factory()->create([
            'photo_path' => 'issue-photos/real_photo.jpg',
            'video_path' => 'issue-videos/real_video.mp4',
        ]);

        Storage::disk('public')->put('issue-photos/real_photo.jpg', 'fake-image-content');
        Storage::disk('public')->put('issue-videos/real_video.mp4', 'fake-video-content');

        $response = $this->get('/issues/photo/' . $issue->reference_code);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/jpeg');
    }

    public function test_feed_includes_video_data(): void
    {
        $issue = \App\Models\Issue::factory()->create([
            'video_path' => 'issue-videos/feed_video.mp4',
            'organization_id' => $this->org->id,
        ]);

        Storage::disk('public')->put('issue-videos/feed_video.mp4', 'fake-video-content');

        $response = $this->get('/feed');

        $response->assertOk();
        $response->assertSee($issue->reference_code);
        $this->assertTrue($issue->has_video);
    }
}
