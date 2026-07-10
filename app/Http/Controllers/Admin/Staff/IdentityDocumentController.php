<?php

namespace App\Http\Controllers\Admin\Staff;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class IdentityDocumentController extends Controller
{
    public function show(User $user, string $side)
    {
        if (!$user->is_staff) {
            abort(404);
        }

        if (!in_array($side, ['front', 'back'], true)) {
            abort(404);
        }

        $path = $side === 'back' ? $user->identity_document_back : $user->identity_document_front;

        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('public')->path($path));
    }
}
