<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Flag extends Model
{
    protected $fillable = [
        'flaggable_type',
        'flaggable_id',
        'user_id',
        'reason',
        'description',
        'status',
    ];

    public function flaggable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }
}
