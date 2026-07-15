<?php

namespace App\Console\Commands;

use App\Models\Issue;
use App\Services\EscalationService;
use Illuminate\Console\Command;

class EscalateIssues extends Command
{
    protected $signature = 'issues:escalate';
    protected $description = 'Auto-escalate issues that have breached SLA';

    public function handle(): int
    {
        $count = 0;
        Issue::whereNotIn('status', ['resolved', 'merged'])
            ->lazy()
            ->filter(fn($issue) => $issue->isSlaBreached())
            ->each(function ($issue) use (&$count) {
                $result = EscalationService::escalate($issue);
                if ($result) {
                    $count++;
                    $this->info("Escalated {$issue->reference_code}");
                }
            });

        $this->info("Escalated {$count} issue(s).");
        return Command::SUCCESS;
    }
}
