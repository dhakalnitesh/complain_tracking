<?php

use App\Console\Commands\AnonymizeIps;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(AnonymizeIps::class)->hourly();
Schedule::command('queue:monitor --max=10')->everyMinute()->withoutOverlapping();
