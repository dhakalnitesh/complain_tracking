<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Upvote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'issue_id',
    ];

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function hasUpvoted(int $issueId, ?int $userId, ?string $sessionId): bool
    {
        if ($userId) {
            return static::where('issue_id', $issueId)->where('user_id', $userId)->exists();
        }
        if ($sessionId) {
            return static::where('issue_id', $issueId)->where('session_id', $sessionId)->exists();
        }
        return false;
    }

    public static function toggle(int $issueId, ?int $userId, ?string $sessionId): array
    {
        $query = static::where('issue_id', $issueId);

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return ['upvoted' => false, 'count' => static::where('issue_id', $issueId)->count()];
        }

        $existing = $query->first();

        if ($existing) {
            $existing->delete();
            $upvoted = false;
        } else {
            static::create([
                'issue_id' => $issueId,
                'user_id' => $userId,
                'session_id' => $sessionId,
            ]);
            $upvoted = true;
        }

        return [
            'upvoted' => $upvoted,
            'count' => static::where('issue_id', $issueId)->count(),
        ];
    }
}
