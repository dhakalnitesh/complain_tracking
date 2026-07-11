<?php

namespace App\Console\Commands;

use App\Models\Issue;
use App\Services\IpAnonymizer;
use Illuminate\Console\Command;

class AnonymizeIps extends Command
{
    protected $signature = 'issues:anonymize-ips';
    protected $description = 'Nullify raw IP addresses older than 24 hours';

    public function handle(): int
    {
        $count = Issue::whereNotNull('reporter_ip')
            ->where('created_at', '<', now()->subHours(24))
            ->update(['reporter_ip' => null]);

        $this->info("Anonymized {$count} IP addresses.");
        return Command::SUCCESS;
    }
}
