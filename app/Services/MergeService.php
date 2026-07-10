<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Upvote;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MergeService
{
    public static function merge(Issue $source, Issue $target, User $mergedBy): bool
    {
        if ($source->id === $target->id) {
            return false;
        }

        if ($source->status === 'merged') {
            return false;
        }

        DB::transaction(function () use ($source, $target, $mergedBy) {
            $source->update([
                'status' => 'merged',
                'duplicate_of_id' => $target->id,
            ]);

            Comment::where('issue_id', $source->id)->update(['issue_id' => $target->id]);
            Upvote::where('issue_id', $source->id)->update(['issue_id' => $target->id]);

            IssueEvent::create([
                'issue_id' => $source->id,
                'user_id' => $mergedBy->id,
                'type' => 'merged',
                'description' => "Issue merged into {$target->reference_code}.",
                'metadata' => [
                    'merged_into_id' => $target->id,
                    'merged_into_code' => $target->reference_code,
                ],
                'is_public' => true,
            ]);

            IssueEvent::create([
                'issue_id' => $target->id,
                'user_id' => $mergedBy->id,
                'type' => 'merged',
                'description' => "Merged from {$source->reference_code}.",
                'metadata' => [
                    'merged_from_id' => $source->id,
                    'merged_from_code' => $source->reference_code,
                ],
                'is_public' => true,
            ]);
        });

        return true;
    }
}
