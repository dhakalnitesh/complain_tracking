<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function show($referenceCode)
    {
        $issue = Issue::where('reference_code', $referenceCode)
            ->whereNotNull('photo_path')
            ->firstOrFail();

        if (!$issue->photo_path || !Storage::disk('public')->exists($issue->photo_path)) {
            abort(404);
        }

        return Storage::disk('public')->response($issue->photo_path);
    }
}
