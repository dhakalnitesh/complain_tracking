<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Issue extends Model
{
    protected $fillable = [
        'reference_code',
        'category',
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
        'resolved_at',
        'rating',
        'feedback_comment',
        'feedback_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'feedback_at' => 'datetime',
            'is_anonymous' => 'boolean',
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

    public function events(): HasMany
    {
        return $this->hasMany(IssueEvent::class);
    }

    public static function generateReferenceCode(int $orgId): string
    {
        $org = Organization::find($orgId);
        $prefix = $org ? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $org->name), 0, 3)) : 'GRV';
        $count = static::where('organization_id', $orgId)->count() + 1;
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
