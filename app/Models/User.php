<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'organization_id',
        'is_admin',
        'is_staff',
        'identity_type',
        'identity_number',
        'identity_document_front',
        'identity_document_back',
        'phone',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'identity_document_front_url',
        'identity_document_back_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_staff' => 'boolean',
        ];
    }

    public function getIdentityDocumentFrontUrlAttribute(): ?string
    {
        return $this->identity_document_front
            ? route('admin.staff.identity-document', ['user' => $this->id, 'side' => 'front'])
            : null;
    }

    public function getIdentityDocumentBackUrlAttribute(): ?string
    {
        return $this->identity_document_back
            ? route('admin.staff.identity-document', ['user' => $this->id, 'side' => 'back'])
            : null;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(IssueEvent::class);
    }

    public function scopeStaff(Builder $query): Builder
    {
        return $query->where('is_staff', true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->is_admin;
    }

    public function isOrgAdmin(): bool
    {
        return $this->organization_id !== null;
    }

    public function isStaff(): bool
    {
        return $this->is_staff;
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_user')
            ->withTimestamps();
    }
}
