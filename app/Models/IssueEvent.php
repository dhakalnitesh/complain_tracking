<?php

namespace App\Models;

use App\Services\BsDateService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_id',
        'user_id',
        'type',
        'description',
        'metadata',
        'is_public',
    ];

    protected $appends = [
        'bs_created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_public' => 'boolean',
        ];
    }

    public function getBsCreatedAtAttribute(): ?string
    {
        return $this->created_at ? BsDateService::toBsString($this->created_at, 'short') : null;
    }

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
