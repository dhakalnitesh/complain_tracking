<?php

namespace Tests\Unit;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_scope_returns_only_staff_users(): void
    {
        User::factory()->create(['is_staff' => true, 'is_admin' => false]);
        User::factory()->create(['is_staff' => false, 'is_admin' => false]);

        $staffUsers = User::staff()->get();

        $this->assertCount(1, $staffUsers);
        $this->assertTrue($staffUsers->first()->is_staff);
    }

    public function test_is_staff_helper_returns_correctly(): void
    {
        $staff = User::factory()->create(['is_staff' => true]);
        $nonStaff = User::factory()->create(['is_staff' => false]);

        $this->assertTrue($staff->isStaff());
        $this->assertFalse($nonStaff->isStaff());
    }

    public function test_staff_belongs_to_organization(): void
    {
        $org = Organization::factory()->create();
        $staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $org->id,
        ]);

        $this->assertInstanceOf(Organization::class, $staff->organization);
        $this->assertEquals($org->id, $staff->organization->id);
    }

    public function test_is_super_admin_returns_true_for_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $nonAdmin = User::factory()->create(['is_admin' => false]);

        $this->assertTrue($admin->isSuperAdmin());
        $this->assertFalse($nonAdmin->isSuperAdmin());
    }

    public function test_is_org_admin_returns_true_when_organization_id_is_set(): void
    {
        $org = Organization::factory()->create();
        $orgAdmin = User::factory()->create(['organization_id' => $org->id]);
        $noOrg = User::factory()->create(['organization_id' => null]);

        $this->assertTrue($orgAdmin->isOrgAdmin());
        $this->assertFalse($noOrg->isOrgAdmin());
    }
}
