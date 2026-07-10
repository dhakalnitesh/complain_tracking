<?php

namespace Tests\Feature;

use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $admin;
    private Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::factory()->create(['name' => 'Test Organization']);
        $this->admin = User::factory()->create([
            'is_admin' => true,
            'organization_id' => null,
        ]);
    }

    public function test_admin_can_view_staff_list(): void
    {
        User::factory()->count(3)->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)->get(route('admin.staff'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Staff/Index')
            ->has('staff.data', 3)
        );
    }

    public function test_admin_can_create_staff_user(): void
    {
        $staffData = [
            'name' => 'Ram Sharma',
            'email' => 'ram@test.org',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_id' => $this->org->id,
            'identity_type' => 'citizenship',
            'identity_number' => '23-01-12345678',
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('admin.staff.store'), $staffData);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'ram@test.org',
            'is_staff' => true,
            'organization_id' => $this->org->id,
        ]);
    }

    public function test_admin_can_delete_staff_user(): void
    {
        $staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->delete(route('admin.staff.destroy', $staff));

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_non_admin_cannot_manage_staff(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user)
            ->get(route('admin.staff'));

        $response->assertRedirect();
    }

    public function test_create_staff_email_must_be_unique(): void
    {
        User::factory()->create([
            'email' => 'existing@test.org',
            'is_staff' => true,
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.staff.store'), [
            'name' => 'Test User',
            'email' => 'existing@test.org',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_id' => $this->org->id,
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_admin_can_update_staff_without_password(): void
    {
        $staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.staff.update', $staff), [
                'name' => 'New Name',
                'email' => $staff->email,
                'organization_id' => $this->org->id,
                'identity_type' => 'passport',
                'identity_number' => 'AB123456',
                'phone' => '9812345678',
                'address' => 'Kathmandu',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_can_update_staff_with_new_password(): void
    {
        $staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.staff.update', $staff), [
                'name' => $staff->name,
                'email' => $staff->email,
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
                'organization_id' => $this->org->id,
                'identity_type' => 'citizenship',
                'identity_number' => '23-01-12345678',
            ]);

        $response->assertRedirect();
    }

    public function test_update_staff_email_must_be_unique(): void
    {
        $staff1 = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
            'email' => 'staff1@test.org',
        ]);
        User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
            'email' => 'staff2@test.org',
        ]);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.staff.update', $staff1), [
                'name' => $staff1->name,
                'email' => 'staff2@test.org',
                'organization_id' => $this->org->id,
                'identity_type' => 'citizenship',
                'identity_number' => '23-01-12345678',
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_staff_user_appears_in_assignment_dropdown(): void
    {
        $staff = User::factory()->create([
            'is_staff' => true,
            'organization_id' => $this->org->id,
            'name' => 'Sita Devi',
        ]);

        $nonStaff = User::factory()->create([
            'is_staff' => false,
            'organization_id' => $this->org->id,
            'name' => 'Not Staff',
        ]);

        $dropdown = User::staff()
            ->where('organization_id', $this->org->id)
            ->get();

        $this->assertTrue($dropdown->contains('id', $staff->id));
        $this->assertFalse($dropdown->contains('id', $nonStaff->id));
    }
}
