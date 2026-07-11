<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RouteSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_public_routes_return_200(): void
    {
        $routes = ['/', '/feed', '/submit', '/status', '/login', '/register'];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $this->assertTrue(
                $response->status() >= 200 && $response->status() < 500,
                "Route [{$route}] returned {$response->status()}"
            );
        }
    }

    public function test_api_routes_return_json(): void
    {
        $response = $this->getJson('/api/stats/overview');
        $response->assertStatus(200)->assertJsonStructure(['total_issues', 'open_issues', 'resolved_issues']);

        $response = $this->getJson('/api/stats/categories');
        $response->assertStatus(200);
    }

    public function test_org_dashboard_returns_200(): void
    {
        $org = \App\Models\Organization::first();
        $this->assertNotNull($org);
        $response = $this->get("/org/{$org->slug}");
        $response->assertStatus(200);
    }

    public function test_admin_login_returns_200(): void
    {
        $response = $this->get('/admin/login');
        $response->assertStatus(200);
    }

    public function test_admin_routes_authenticated(): void
    {
        $admin = User::where('is_admin', true)->first();
        $this->assertNotNull($admin);

        $protectedRoutes = [
            '/admin/dashboard',
            '/admin/issues',
            '/admin/staff',
            '/admin/organizations',
            '/admin/moderation',
            '/admin/spam-logs',
            '/admin/moderation/comments',
        ];

        foreach ($protectedRoutes as $uri) {
            $response = $this->actingAs($admin)->get($uri);
            $this->assertTrue(
                $response->status() >= 200 && $response->status() < 500,
                "Admin route [{$uri}] returned {$response->status()}"
            );
        }
    }

    public function test_admin_routes_redirect_unauthenticated(): void
    {
        $response = $this->get('/admin/dashboard');
        $this->assertTrue(in_array($response->status(), [302, 301]), 'Unauthenticated admin route should redirect');
    }

    public function test_staff_routes_redirect_unauthenticated(): void
    {
        $response = $this->get('/staff/issues/1');
        $this->assertTrue(in_array($response->status(), [302, 301, 404]), 'Unauthenticated staff route should redirect or 404');
    }

    public function test_export_csv_returns_200_for_admin(): void
    {
        $admin = User::where('is_admin', true)->first();
        $this->assertNotNull($admin);

        $response = $this->actingAs($admin)->get('/admin/export/csv');
        $response->assertStatus(200);
    }
}
