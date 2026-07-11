<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.{orgId}', function ($user, $orgId) {
    if ($user->isSuperAdmin()) {
        return (int) $orgId === 0 || (int) $user->organization_id === (int) $orgId;
    }
    return ($user->is_staff || $user->isOrgAdmin())
        && (int) $user->organization_id === (int) $orgId;
});

Broadcast::channel('admin.global', function ($user) {
    return $user->isSuperAdmin();
});
