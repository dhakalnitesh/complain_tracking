<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    public function show($referenceCode)
    {
        $issue = Issue::visible()->where('reference_code', $referenceCode)->firstOrFail();

        if (!$issue->video_path || !Storage::disk('public')->exists($issue->video_path)) {
            abort(404);
        }

        $mime = Storage::disk('public')->mimeType($issue->video_path);

        return Storage::disk('public')->response($issue->video_path, null, [
            'Content-Type' => $mime,
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
