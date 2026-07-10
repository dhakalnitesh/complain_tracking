<?php

namespace Database\Factories;

use App\Models\Issue;
use App\Models\Upvote;
use Illuminate\Database\Eloquent\Factories\Factory;

class UpvoteFactory extends Factory
{
    protected $model = Upvote::class;

    public function definition(): array
    {
        return [
            'issue_id' => Issue::factory(),
            'session_id' => fake()->uuid(),
        ];
    }
}
