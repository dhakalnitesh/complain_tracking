<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Road/Infrastructure', 'Water Supply', 'Garbage/Waste',
            'Electricity', 'Sanitation', 'Health/Medical',
            'Education', 'Safety/Security', 'Harassment', 'Other',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }
}
