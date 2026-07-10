<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $kmc = Organization::where('slug', 'kathmandu-metropolitan-city')->first();

        if (!$kmc) return;

        $mainDepartments = [
            ['name' => 'Ward Office', 'sort_order' => 1, 'children' => []],
            ['name' => 'Environment & Waste Management', 'sort_order' => 2, 'children' => ['Cleaning Division', 'Waste Collection', 'Public Toilets']],
            ['name' => 'Roads & Infrastructure', 'sort_order' => 3, 'children' => ['Road Maintenance', 'Street Lighting', 'Drainage']],
            ['name' => 'Water Supply & Sanitation', 'sort_order' => 4, 'children' => ['Water Distribution', 'Pipeline Maintenance']],
            ['name' => 'Health & Medical', 'sort_order' => 5, 'children' => ['Public Health', 'Vaccination Center']],
            ['name' => 'Education', 'sort_order' => 6, 'children' => ['School Administration', 'Scholarship']],
            ['name' => 'Safety & Security', 'sort_order' => 7, 'children' => ['Traffic Management', 'Emergency Response']],
            ['name' => 'Administration', 'sort_order' => 8, 'children' => ['HR', 'Finance', 'Records']],
            ['name' => 'Revenue & Taxation', 'sort_order' => 9, 'children' => ['Property Tax', 'Business Registration']],
            ['name' => 'Social Development', 'sort_order' => 10, 'children' => ['Women & Children', 'Senior Citizens', 'Disability Services']],
        ];

        foreach ($mainDepartments as $data) {
            $parent = Department::create([
                'organization_id' => $kmc->id,
                'name' => $data['name'],
                'slug' => \Illuminate\Support\Str::slug($data['name']),
                'sort_order' => $data['sort_order'],
                'is_active' => true,
            ]);

            foreach ($data['children'] as $childName) {
                Department::create([
                    'organization_id' => $kmc->id,
                    'name' => $childName,
                    'slug' => \Illuminate\Support\Str::slug($childName),
                    'parent_id' => $parent->id,
                    'sort_order' => 1,
                    'is_active' => true,
                ]);
            }
        }

        $this->command?->info('KMC departments seeded: ' . Department::where('organization_id', $kmc->id)->count() . ' departments');
    }
}
