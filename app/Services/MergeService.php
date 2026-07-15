<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\IssueMedia;
use App\Models\Upvote;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MergeService
{
    private static function wouldCreateCycle(Issue $source, Issue $target): bool
    {
        $visited = [$source->id];
        $current = $target;

        while ($current->duplicate_of_id !== null) {
            if (in_array($current->duplicate_of_id, $visited, true)) {
                return true;
            }
            $visited[] = $current->duplicate_of_id;

            $next = Issue::find($current->duplicate_of_id);
            if (!$next) {
                break;
            }
            $current = $next;
        }

        return false;
    }

    public static function autoMerge(Issue $source, Issue $target): bool
    {
        if ($source->id === $target->id || $source->status === 'merged') {
            return false;
        }

        if ($target->status === 'merged') {
            return false;
        }

        if (self::wouldCreateCycle($source, $target)) {
            return false;
        }

        return DB::transaction(function () use ($source, $target) {
            $source->update([
                'status' => 'merged',
                'duplicate_of_id' => $target->id,
            ]);

            IssueMedia::where('issue_id', $source->id)->update(['issue_id' => $target->id]);
            Comment::where('issue_id', $source->id)->update(['issue_id' => $target->id]);

            foreach (Upvote::where('issue_id', $source->id)->get() as $upvote) {
                if (!Upvote::hasUpvoted($target->id, $upvote->user_id, $upvote->session_id)) {
                    $upvote->update(['issue_id' => $target->id]);
                }
            }

            IssueEvent::create([
                'issue_id' => $source->id,
                'type' => 'merged',
                'description' => "Auto-merged into {$target->reference_code}.",
                'metadata' => ['merged_into_id' => $target->id, 'merged_into_code' => $target->reference_code],
                'is_public' => true,
            ]);

            IssueEvent::create([
                'issue_id' => $target->id,
                'type' => 'merged',
                'description' => "Another citizen also reported this issue (from {$source->reference_code}).",
                'metadata' => ['merged_from_id' => $source->id, 'merged_from_code' => $source->reference_code],
                'is_public' => true,
            ]);

            return true;
        });
    }

    public static function merge(Issue $source, Issue $target, User $mergedBy): bool
    {
        if ($source->id === $target->id) {
            return false;
        }

        if ($source->status === 'merged') {
            return false;
        }

        if ($target->status === 'merged') {
            return false;
        }

        if (self::wouldCreateCycle($source, $target)) {
            return false;
        }

        DB::transaction(function () use ($source, $target, $mergedBy) {
            $source->update([
                'status' => 'merged',
                'duplicate_of_id' => $target->id,
            ]);

            IssueMedia::where('issue_id', $source->id)->update(['issue_id' => $target->id]);
            Comment::where('issue_id', $source->id)->update(['issue_id' => $target->id]);

            foreach (Upvote::where('issue_id', $source->id)->get() as $upvote) {
                if (!Upvote::hasUpvoted($target->id, $upvote->user_id, $upvote->session_id)) {
                    $upvote->update(['issue_id' => $target->id]);
                }
            }

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
