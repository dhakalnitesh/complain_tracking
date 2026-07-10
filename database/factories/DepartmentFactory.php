<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Ward Office', 'Environment', 'Roads', 'Water Supply',
            'Sanitation', 'Education', 'Health', 'Administration',
            'Revenue', 'Planning',
        ]);

        return [
            'organization_id' => Organization::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }
}
