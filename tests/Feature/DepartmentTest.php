<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoutingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_department_belongs_to_organization(): void
    {
        $org = Organization::factory()->create();
        $dept = Department::factory()->create(['organization_id' => $org->id]);

        $this->assertTrue($dept->organization->is($org));
    }

    public function test_department_can_have_children(): void
    {
        $org = Organization::factory()->create();
        $parent = Department::factory()->create(['organization_id' => $org->id]);
        $child = Department::factory()->create(['organization_id' => $org->id, 'parent_id' => $parent->id]);

        $this->assertTrue($parent->children->contains($child));
        $this->assertEquals($parent->id, $child->parent_id);
    }

    public function test_auto_routing_assigns_department(): void
    {
        $org = Organization::factory()->create();
        $dept = Department::factory()->create([
            'organization_id' => $org->id,
            'name' => 'Roads and Infrastructure',
        ]);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'category' => 'Road/Infrastructure',
        ]);

        RoutingService::autoRoute($issue);
        $issue->refresh();

        $this->assertEquals($dept->id, $issue->department_id);
    }

    public function test_org_admin_can_view_departments(): void
    {
        $org = Organization::factory()->create();
        $admin = User::factory()->create([
            'organization_id' => $org->id,
            'is_admin' => false,
            'is_staff' => false,
        ]);
        Department::factory()->count(3)->create(['organization_id' => $org->id]);

        $response = $this->actingAs($admin)->get(route('org-admin.departments'));

        $response->assertStatus(200);
    }

    public function test_org_admin_can_create_department(): void
    {
        $org = Organization::factory()->create();
        $admin = User::factory()->create([
            'organization_id' => $org->id,
            'is_admin' => false,
            'is_staff' => false,
        ]);

        $response = $this->actingAs($admin)->post(route('org-admin.departments.store'), [
            'name' => 'Water Supply',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('departments', ['name' => 'Water Supply', 'organization_id' => $org->id]);
    }
}
