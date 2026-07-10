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
        $breached = Issue::whereNotIn('status', ['resolved', 'merged'])
            ->get()
            ->filter(fn($issue) => $issue->isSlaBreached());

        $count = 0;
        foreach ($breached as $issue) {
            $result = EscalationService::escalate($issue);
            if ($result) {
                $count++;
                $this->info("Escalated {$issue->reference_code}");
            }
        }

        $this->info("Escalated {$count} issue(s).");
        return Command::SUCCESS;
    }
}
