<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpamLog extends Model
{
    protected $fillable = [
        'event_type',
        'loggable_type',
        'loggable_id',
        'uuid',
        'ip_hash',
        'spam_score',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'spam_score' => 'float',
        ];
    }

    public function loggable()
    {
        return $this->morphTo();
    }
}
