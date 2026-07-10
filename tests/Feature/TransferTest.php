<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Services\TransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransferTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_transfer_issue_to_another_department(): void
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);
        $dept1 = Department::factory()->create(['organization_id' => $org->id, 'name' => 'Roads']);
        $dept2 = Department::factory()->create(['organization_id' => $org->id, 'name' => 'Water']);

        $issue = Issue::factory()->create([
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'department_id' => $dept1->id,
        ]);

        $admin = User::factory()->create(['is_admin' => true]);

        $result = TransferService::transferToDepartment($issue, $dept2->id, $admin, 'Re-routed to correct department');

        $this->assertTrue($result);
        $issue->refresh();
        $this->assertEquals($dept2->id, $issue->department_id);
        $this->assertDatabaseHas('issue_events', [
            'issue_id' => $issue->id,
            'type' => 'transferred',
        ]);
    }

    public function test_can_transfer_issue_to_another_organization(): void
    {
        $org1 = Organization::factory()->create();
        $org2 = Organization::factory()->create();
        $location1 = Location::factory()->create(['organization_id' => $org1->id]);
        $location2 = Location::factory()->create(['organization_id' => $org2->id]);

        $issue = Issue::factory()->create([
            'organization_id' => $org1->id,
            'location_id' => $location1->id,
        ]);

        $admin = User::factory()->create(['is_admin' => true]);

        $result = TransferService::transferToOrganization($issue, $org2->id, $location2->id, $admin, 'Belongs to other org');

        $this->assertTrue($result);
        $issue->refresh();
        $this->assertEquals($org2->id, $issue->organization_id);
    }
}
