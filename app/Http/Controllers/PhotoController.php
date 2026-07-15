<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function show($referenceCode)
    {
        $issue = Issue::visible()->where('reference_code', $referenceCode)->firstOrFail();

        if (!$issue->photo_path || !Storage::disk('public')->exists($issue->photo_path)) {
            abort(404);
        }

        return Storage::disk('public')->response($issue->photo_path);
    }
}
