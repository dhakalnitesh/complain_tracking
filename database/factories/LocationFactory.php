<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class LocationFactory extends Factory
{
    protected $model = Location::class;

    public function definition(): array
    {
        return [
            'name' => fake()->city() . ' ' . fake()->randomElement(['Campus', 'Office', 'Ward', 'Block']),
            'organization_id' => Organization::factory(),
        ];
    }
}
