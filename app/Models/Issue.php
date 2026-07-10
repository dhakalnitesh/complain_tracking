<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Issue extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_code',
        'category',
        'category_id',
        'priority',
        'location_id',
        'organization_id',
        'description',
        'reporter_name',
        'reporter_phone',
        'reporter_email',
        'photo_path',
        'is_anonymous',
        'status',
        'assigned_to',
        'assigned_user_id',
        'sms_opt_in',
        'resolved_at',
        'rating',
        'feedback_comment',
        'feedback_at',
        'duplicate_of_id',
        'department_id',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'feedback_at' => 'datetime',
            'is_anonymous' => 'boolean',
            'sms_opt_in' => 'boolean',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(IssueEvent::class);
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function upvotes(): HasMany
    {
        return $this->hasMany(Upvote::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplicate_of_id');
    }

    public function duplicates(): HasMany
    {
        return $this->hasMany(self::class, 'duplicate_of_id');
    }

    public function upvotesCount(): int
    {
        return Cache::remember("upvote_count_{$this->id}", 300, fn() => $this->upvotes()->count());
    }

    public function commentsCount(): int
    {
        return $this->comments()->count();
    }

    public function isUpvotedBy(?int $userId, ?string $sessionId): bool
    {
        return Upvote::hasUpvoted($this->id, $userId, $sessionId);
    }

    public static function generateReferenceCode(int $orgId): string
    {
        $org = Organization::find($orgId);
        $clean = $org ? preg_replace('/[^A-Za-z0-9]/', '', $org->name) : '';
        $prefix = strtoupper(substr($clean, 0, 3)) ?: 'GRV';
        $count = static::withTrashed()->where('organization_id', $orgId)->count() + 1;
        return $prefix . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function isEscalated(): bool
    {
        return $this->status !== 'resolved'
            && $this->created_at->lt(now()->subHours(24));
    }

    public function slaDeadline(): ?\DateTimeInterface
    {
        return $this->created_at->addHours(48);
    }

    public function isSlaBreached(): bool
    {
        return $this->status !== 'resolved' && now()->greaterThan($this->slaDeadline());
    }
}
