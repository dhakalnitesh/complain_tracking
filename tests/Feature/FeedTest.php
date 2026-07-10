<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_feed_page_loads_successfully(): void
    {
        $response = $this->get(route('feed'));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page->component('Public/Feed'));
    }

    public function test_feed_shows_issues(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $category = Category::factory()->create();

        Issue::factory()->count(3)->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category_id' => $category->id,
        ]);

        $response = $this->get(route('feed'));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->component('Public/Feed')
            ->has('issues.data', 3)
        );
    }

    public function test_feed_can_filter_by_category(): void
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category_id' => $category1->id,
        ]);
        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category_id' => $category2->id,
        ]);

        $response = $this->get(route('feed', ['category_id' => $category1->id]));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->component('Public/Feed')
            ->has('issues.data', 1)
        );
    }

    public function test_feed_can_filter_by_status(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $category = Category::factory()->create();

        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category_id' => $category->id,
            'status' => 'received',
        ]);
        Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category_id' => $category->id,
            'status' => 'resolved',
        ]);

        $response = $this->get(route('feed', ['status' => 'resolved']));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->component('Public/Feed')
            ->has('issues.data', 1)
        );
    }
}
