<?php

namespace Tests\Unit;

use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VideoTest extends TestCase
{
    use RefreshDatabase;

    public function test_has_video_returns_false_when_no_video(): void
    {
        $issue = Issue::factory()->create(['video_path' => null]);

        $this->assertFalse($issue->has_video);
    }

    public function test_has_video_returns_true_when_video_exists(): void
    {
        $issue = Issue::factory()->create(['video_path' => 'issue-videos/test.mp4']);

        $this->assertTrue($issue->has_video);
    }

    public function test_photo_and_video_are_independent(): void
    {
        $photoOnly = Issue::factory()->create([
            'photo_path' => 'issue-photos/photo.jpg',
            'video_path' => null,
        ]);
        $videoOnly = Issue::factory()->create([
            'photo_path' => null,
            'video_path' => 'issue-videos/video.mp4',
        ]);
        $both = Issue::factory()->create([
            'photo_path' => 'issue-photos/photo.jpg',
            'video_path' => 'issue-videos/video.mp4',
        ]);
        $neither = Issue::factory()->create([
            'photo_path' => null,
            'video_path' => null,
        ]);

        $this->assertTrue($photoOnly->has_photo);
        $this->assertFalse($photoOnly->has_video);
        $this->assertFalse($videoOnly->has_photo);
        $this->assertTrue($videoOnly->has_video);
        $this->assertTrue($both->has_photo);
        $this->assertTrue($both->has_video);
        $this->assertFalse($neither->has_photo);
        $this->assertFalse($neither->has_video);
    }
}
