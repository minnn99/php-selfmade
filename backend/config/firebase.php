<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Credentials
    |--------------------------------------------------------------------------
    |
    | Firebase service account credentials file path
    |
    */
    'credentials' => env('FIREBASE_CREDENTIALS_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Database URL
    |--------------------------------------------------------------------------
    |
    | Firebase Realtime Database URL (optional)
    |
    */
    'database_url' => env('FIREBASE_DATABASE_URL'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Project ID
    |--------------------------------------------------------------------------
    |
    | Firebase project ID for FCM
    |
    */
    'project_id' => env('FIREBASE_PROJECT_ID'),

    /*
    |--------------------------------------------------------------------------
    | Default notification settings
    |--------------------------------------------------------------------------
    |
    | Default settings for notifications
    |
    */
    'default_notification_settings' => [
        'period_notifications' => true,
        'ovulation_notifications' => true,
        'partner_notifications' => true,
        'system_notifications' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification timing settings
    |--------------------------------------------------------------------------
    |
    | Settings for when to send notifications
    |
    */
    'notification_timing' => [
        'period_reminder_days_before' => 1, // 1日前に通知
        'ovulation_reminder_days_before' => 0, // 当日に通知
        'period_check_time' => '09:00', // 朝9時に通知
        'reminder_time' => '20:00', // 夜8時にリマインダー
    ],
];