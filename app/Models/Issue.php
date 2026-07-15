<?php

namespace App\Models;

use App\Services\BsDateService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class Issue extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_code',
        'title',
        'category',
        'category_id',
        'priority',
        'user_priority',
        'admin_priority',
        'priority_reviewed_at',
        'priority_reviewed_by',
        'location_id',
        'organization_id',
        'description',
        'reporter_name',
        'reporter_phone',
        'reporter_email',
        'reporter_ip',
        'photo_path',
        'video_path',
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
        'hidden_at',
        'deadline_at',
        'extension_deadline_at',
        'resolution_summary',
        'resolved_by',
        'anonymous_uuid',
        'reporter_ip_hash',
        'spam_score',
        'moderation_status',
    ];

    protected $appends = [
        'bs_created_at',
        'bs_updated_at',
        'bs_resolved_at',
        'has_video',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'feedback_at' => 'datetime',
            'hidden_at' => 'datetime',
            'is_anonymous' => 'boolean',
            'sms_opt_in' => 'boolean',
            'spam_score' => 'float',
            'deadline_at' => 'datetime',
            'extension_deadline_at' => 'datetime',

        ];
    }

    public function scopeVisible($query)
    {
        return $query->whereNull('hidden_at');
    }

    public function getBsCreatedAtAttribute(): ?string
    {
        return $this->created_at ? BsDateService::toBsString($this->created_at, 'short') : null;
    }

    public function getBsUpdatedAtAttribute(): ?string
    {
        return $this->updated_at ? BsDateService::toBsString($this->updated_at, 'short') : null;
    }

    public function getBsResolvedAtAttribute(): ?string
    {
        return $this->resolved_at
            ? BsDateService::toBsString($this->resolved_at, 'short')
            : null;
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

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
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

    public function media(): HasMany
    {
        return $this->hasMany(IssueMedia::class);
    }

    public function getHasPhotoAttribute(): bool
    {
        return !is_null($this->photo_path);
    }

    public function getHasVideoAttribute(): bool
    {
        return !is_null($this->video_path);
    }

    public function dailyProgress(): HasMany
    {
        return $this->hasMany(DailyProgress::class);
    }

    public function extensionRequests(): HasMany
    {
        return $this->hasMany(ExtensionRequest::class);
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

        return DB::transaction(function () use ($prefix) {
            $maxAttempts = 5;
            for ($i = 0; $i < $maxAttempts; $i++) {
                $seq = DB::table('reference_code_sequences')->insertGetId([
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $code = $prefix . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);

                $exists = static::where('reference_code', $code)->exists();
                if (!$exists) {
                    return $code;
                }
            }

            $seq = DB::table('reference_code_sequences')->insertGetId([
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $code = $prefix . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
            $code .= chr(rand(65, 90));

            return $code;
        });
    }

    public function isEscalated(): bool
    {
        $hours = config("sla.priorities.{$this->effectivePriority()}.hours", 24);
        return $this->status !== 'resolved'
            && $this->status !== 'merged'
            && $this->created_at->lt(now()->subHours((int) $hours));
    }

    public function slaDeadline(): ?\DateTimeInterface
    {
        $hours = config("sla.priorities.{$this->effectivePriority()}.hours", 48);
        return $this->created_at->addHours($hours);
    }

    public function effectivePriority(): string
    {
        return $this->admin_priority ?? $this->priority;
    }

    public function isSlaBreached(): bool
    {
        if (in_array($this->status, ['resolved', 'merged'], true)) {
            return false;
        }
        return now()->greaterThanOrEqualTo($this->slaDeadline());
    }
}
