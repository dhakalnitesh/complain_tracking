<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Notification Channel
    |--------------------------------------------------------------------------
    |
    | The default channel to use when sending notifications. Available:
    | 'log' - logs SMS to notification_logs table (free, self-hosted)
    | 'mail' - sends via Laravel Mail using configured mailer
    |
    */

    'default' => env('NOTIFICATION_CHANNEL', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Channel Configuration
    |--------------------------------------------------------------------------
    |
    | Each channel can be enabled/disabled independently. The 'class' must
    | implement NotificationChannelInterface. To add a real SMS gateway
    | (e.g., SPARROW SMS, Ncell), create a new channel class and add it here.
    |
    */

    'channels' => [
        'log' => [
            'enabled' => true,
            'class' => \App\Services\Channels\LogChannel::class,
            'label' => 'SMS (Log)',
        ],
        'mail' => [
            'enabled' => true,
            'class' => \App\Services\Channels\MailChannel::class,
            'label' => 'Email',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Message Templates
    |--------------------------------------------------------------------------
    |
    | Templates for different notification types. :reference_code and :status
    | are replaced dynamically.
    |
    */

    'templates' => [
        'status_change' => 'Your complaint :reference_code status: :status. Track at :track_url',
        'comment_added' => 'Update on :reference_code: :comment',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (seconds)
    |--------------------------------------------------------------------------
    |
    | How long to cache notification delivery stats.
    |
    */

    'cache_ttl' => 300,
];
