<?php

namespace Database\Factories;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\NotificationLog;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationLogFactory extends Factory
{
    protected $model = NotificationLog::class;

    public function definition(): array
    {
        return [
            'issue_id' => Issue::factory(),
            'issue_event_id' => IssueEvent::factory(),
            'channel' => fake()->randomElement(['log', 'mail']),
            'recipient' => fake()->phoneNumber(),
            'message' => fake()->sentence(),
            'status' => 'pending',
        ];
    }

    public function sent(): static
    {
        return $this->state(fn(array $attrs) => [
            'status' => 'sent',
            'delivered_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn(array $attrs) => [
            'status' => 'failed',
            'response' => 'Gateway error',
        ]);
    }
}
