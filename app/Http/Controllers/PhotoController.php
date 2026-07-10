<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function show($referenceCode)
    {
        $issue = Issue::where('reference_code', $referenceCode)->firstOrFail();

        $path = $issue->photo_path ?? $issue->video_path;

        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}
