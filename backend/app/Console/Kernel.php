<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // 毎日朝9時に通知をチェック・送信
        $schedule->command('notifications:send-scheduled')
            ->dailyAt('09:00')
            ->withoutOverlapping()
            ->runInBackground();

        // 毎日夜8時にリマインダー通知をチェック・送信
        $schedule->command('notifications:send-scheduled')
            ->dailyAt('20:00')
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}