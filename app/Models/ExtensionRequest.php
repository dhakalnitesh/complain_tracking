<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtensionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_id',
        'user_id',
        'reason',
        'requested_deadline',
        'status',
        'admin_note',
        'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'requested_deadline' => 'datetime',
        ];
    }

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
