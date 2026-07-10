<?php

namespace App\Models;

use App\Services\BsDateService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_id',
        'user_id',
        'session_id',
        'parent_id',
        'body',
        'is_public',
        'is_approved',
        'hidden_at',
    ];

    protected $appends = [
        'bs_created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_approved' => 'boolean',
            'hidden_at' => 'datetime',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    public function authorName(): string
    {
        if ($this->user) {
            return $this->user->name;
        }
        return 'Anonymous';
    }
}
