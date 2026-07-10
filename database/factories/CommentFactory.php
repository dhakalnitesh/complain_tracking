<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Issue;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'issue_id' => Issue::factory(),
            'body' => fake()->paragraph(),
            'is_public' => true,
            'is_approved' => true,
        ];
    }
}
