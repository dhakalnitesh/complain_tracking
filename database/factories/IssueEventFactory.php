<?php

namespace Database\Factories;

use App\Models\Issue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class IssueEventFactory extends Factory
{
    protected $model = \App\Models\IssueEvent::class;

    public function definition(): array
    {
        return [
            'issue_id' => Issue::factory(),
            'user_id' => User::factory(),
            'type' => 'status_changed',
            'description' => fake()->sentence(),
            'is_public' => true,
        ];
    }

    public function internal(): static
    {
        return $this->state(fn(array $attrs) => [
            'is_public' => false,
        ]);
    }

    public function comment(): static
    {
        return $this->state(fn(array $attrs) => [
            'type' => 'commented',
        ]);
    }
}
