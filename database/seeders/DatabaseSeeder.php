<?php

namespace Database\Seeders;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default organizations
        $defaultOrg = Organization::create([
            'name' => 'Sunrise College',
            'slug' => 'sunrise-college',
            'type' => 'educational',
            'address' => 'Kathmandu, Nepal',
            'phone' => '01-4XXXXXX',
            'email' => 'info@sunrisecollege.edu.np',
            'description' => 'A premier educational institution in Kathmandu.',
            'is_active' => true,
        ]);

        $municipality = Organization::create([
            'name' => 'Kathmandu Metropolitan City',
            'slug' => 'kathmandu-metropolitan',
            'type' => 'municipality',
            'address' => 'Kathmandu, Nepal',
            'phone' => '01-5XXXXXX',
            'email' => 'info@kathmandu.gov.np',
            'description' => 'Kathmandu Metropolitan City Office.',
            'is_active' => true,
        ]);

        // Create super admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@nagariksarokar.com',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
        ]);

        // Create org admin
        User::create([
            'name' => 'College Admin',
            'email' => 'college@nagariksarokar.com',
            'password' => Hash::make('password'),
            'organization_id' => $defaultOrg->id,
        ]);

        // Create locations for default org
        $locations = [
            'Canteen' => null,
            'Library' => null,
            'Account Section' => null,
            "Principal's Room" => null,
            'Staff Room' => null,
            'BBA Block' => null,
            'BCA Block' => null,
        ];

        $locationModels = [];
        foreach ($locations as $name => $parentId) {
            $locationModels[$name] = Location::create([
                'name' => $name,
                'parent_id' => $parentId,
                'organization_id' => $defaultOrg->id,
            ]);
        }

        // BCA Block children
        $bcaBlock = $locationModels['BCA Block'];
        $children = ['MBA Hall', 'MCA Hall', 'Lab'];
        foreach ($children as $child) {
            Location::create([
                'name' => $child,
                'parent_id' => $bcaBlock->id,
                'organization_id' => $defaultOrg->id,
            ]);
        }

        // Municipality locations
        $wardNames = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'];
        foreach ($wardNames as $ward) {
            Location::create([
                'name' => $ward,
                'organization_id' => $municipality->id,
            ]);
        }

        // Sample issues
        $issuesData = [
            [
                'category' => 'Canteen/Food',
                'location' => 'Canteen',
                'priority' => 'high',
                'description' => 'Found a dead cockroach in the rice served during lunch today. The food quality and hygiene have been deteriorating for weeks. Several students have reported stomach issues after eating here.',
                'status' => 'in_progress',
                'days_ago' => 5,
                'assigned_to' => 'Canteen Manager',
            ],
            [
                'category' => 'Toilet/Sanitation',
                'location' => 'Lab',
                'priority' => 'critical',
                'description' => 'The washroom on the second floor of BCA Block has not been cleaned in over a week. The dustbins are overflowing and there is no soap or hand sanitizer available. The smell is unbearable.',
                'status' => 'received',
                'days_ago' => 7,
            ],
            [
                'category' => 'Furniture/Equipment',
                'location' => 'Lab',
                'priority' => 'medium',
                'description' => 'More than half of the computer lab chairs are broken or wobbly. Students are having to stand during practical sessions because there are not enough functional chairs.',
                'status' => 'received',
                'days_ago' => 14,
            ],
            [
                'category' => 'Projector/Board',
                'location' => 'MBA Hall',
                'priority' => 'high',
                'description' => 'The whiteboard in MBA Hall has stained surface and markers are not available. The projector remote is missing and we have to manually turn it on/off each time.',
                'status' => 'received',
                'days_ago' => 3,
            ],
            [
                'category' => 'Cleanliness',
                'location' => 'Library',
                'priority' => 'medium',
                'description' => 'The library has not been properly cleaned in weeks. Dust has accumulated on bookshelves and the floor is sticky near the entrance.',
                'status' => 'received',
                'days_ago' => 10,
            ],
            [
                'category' => 'Exam Concern',
                'location' => 'Account Section',
                'priority' => 'high',
                'description' => 'The semester exam timetable was released only 5 days before exams. Several subjects have back-to-back exams with no gap for preparation.',
                'status' => 'resolved',
                'days_ago' => 4,
                'resolved' => true,
            ],
            [
                'category' => 'Admin/Account Delay',
                'location' => 'Account Section',
                'priority' => 'critical',
                'description' => 'Submitted scholarship application forms three weeks ago. Every time I visit, they say "come tomorrow" or "the officer is not here." The deadline is next week.',
                'status' => 'received',
                'days_ago' => 21,
            ],
            [
                'category' => 'Canteen/Food',
                'location' => 'Canteen',
                'priority' => 'medium',
                'description' => 'The canteen prices have increased without any notice displayed. A plate of rice that used to cost Rs 30 is now Rs 40. Students were not informed.',
                'status' => 'resolved',
                'days_ago' => 6,
                'resolved' => true,
            ],
            [
                'category' => 'Class Scheduling',
                'location' => 'BBA Block',
                'priority' => 'high',
                'description' => 'Our Data Structures teacher was replaced without any notice. The new teacher is not covering the syllabus properly and we have university exams in two months.',
                'status' => 'received',
                'days_ago' => 2,
            ],
            [
                'category' => 'Electricity/Water',
                'location' => 'BCA Block',
                'priority' => 'critical',
                'description' => 'No electricity in BCA Block for the past 3 days during afternoon sessions. Lab practicals and projector-based classes are being cancelled.',
                'status' => 'received',
                'days_ago' => 1,
            ],
        ];

        foreach ($issuesData as $data) {
            $locName = $data['location'];
            $loc = Location::where('name', $locName)->first();
            if (!$loc) continue;

            $createdAt = now()->subDays($data['days_ago']);

            $issue = Issue::create([
                'organization_id' => $defaultOrg->id,
                'category' => $data['category'],
                'priority' => $data['priority'],
                'location_id' => $loc->id,
                'description' => $data['description'],
                'status' => $data['status'],
                'assigned_to' => $data['assigned_to'] ?? null,
                'resolved_at' => isset($data['resolved']) ? $createdAt->copy()->addHours(2) : null,
                'is_anonymous' => true,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $issue->update(['reference_code' => 'GRV-' . str_pad($issue->id, 4, '0', STR_PAD_LEFT)]);

            IssueEvent::create([
                'issue_id' => $issue->id,
                'type' => 'created',
                'description' => 'Issue submitted successfully.',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            if ($issue->status === 'in_progress') {
                IssueEvent::create([
                    'issue_id' => $issue->id,
                    'type' => 'status_changed',
                    'description' => 'Status changed from received to in_progress.',
                    'created_at' => $createdAt->copy()->addDay(),
                    'updated_at' => $createdAt->copy()->addDay(),
                ]);
            }

            if ($issue->status === 'resolved') {
                IssueEvent::create([
                    'issue_id' => $issue->id,
                    'type' => 'resolved',
                    'description' => 'Issue resolved successfully.',
                    'created_at' => $createdAt->copy()->addHours(2),
                    'updated_at' => $createdAt->copy()->addHours(2),
                ]);
            }
        }

        // Add feedback to resolved issues
        $resolvedIssue1 = Issue::where('status', 'resolved')->first();
        if ($resolvedIssue1) {
            $resolvedIssue1->update([
                'rating' => 4,
                'feedback_comment' => 'Issue was resolved quickly. Thank you!',
                'feedback_at' => now(),
            ]);
        }
    }
}
