<?php

return [
    'priorities' => [
        'critical' => ['hours' => 4, 'label' => 'Critical', 'escalate_after' => 2],
        'high' => ['hours' => 24, 'label' => 'High', 'escalate_after' => 12],
        'medium' => ['hours' => 72, 'label' => 'Medium', 'escalate_after' => 48],
        'low' => ['hours' => 168, 'label' => 'Low', 'escalate_after' => 120],
    ],
];
