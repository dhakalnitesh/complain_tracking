<?php

namespace Database\Factories;

use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class IssueFactory extends Factory
{
    protected $model = Issue::class;

    public function definition(): array
    {
        $org = Organization::factory()->create();
        $location = Location::factory()->create(['organization_id' => $org->id]);

        return [
            'organization_id' => $org->id,
            'location_id' => $location->id,
            'category' => fake()->randomElement([
                'Canteen/Food', 'Toilet/Sanitation', 'Electricity/Water', 'Other',
            ]),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'description' => fake()->paragraph(),
            'status' => 'received',
            'is_anonymous' => true,
        ];
    }
}
