<?php

namespace Tests\Unit;

use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Services\DuplicateDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DuplicateDetectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_similar_issues(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'description' => 'The road in front of main gate has a large pothole that damages vehicles every day. Please fix this urgently.',
        ]);

        $result = DuplicateDetectionService::findDuplicates(
            'The road near main gate has a huge pothole damaging vehicles daily. Please fix this urgently.',
            $org->id
        );

        $this->assertCount(1, $result);
        $this->assertArrayHasKey('reference_code', $result[0]);
        $this->assertArrayHasKey('similarity', $result[0]);
    }

    public function test_returns_empty_for_different_descriptions(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'description' => 'Water leakage from main pipeline near the school causing flooding',
        ]);

        $result = DuplicateDetectionService::findDuplicates(
            'The library needs more computers and updated books for students',
            $org->id
        );

        $this->assertCount(0, $result);
    }

    public function test_returns_empty_for_short_descriptions(): void
    {
        $org = Organization::factory()->create();

        $result = DuplicateDetectionService::findDuplicates('Short text', $org->id);

        $this->assertCount(0, $result);
    }

    public function test_excludes_same_issue_from_results(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'description' => 'Street light not working near chowk for three weeks creating safety concern',
        ]);

        $result = DuplicateDetectionService::findDuplicates(
            'Street light not working near chowk for three weeks creating safety concern',
            $org->id,
            $issue->id
        );

        $this->assertCount(0, $result);
    }
}
