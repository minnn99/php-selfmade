<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\MenstrualCycle;
use App\Services\FirebaseService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendScheduledNotifications extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'notifications:send-scheduled';

    /**
     * The console command description.
     */
    protected $description = 'Send scheduled notifications for periods, ovulation, and reminders';

    protected FirebaseService $firebaseService;

    /**
     * Create a new command instance.
     */
    public function __construct(FirebaseService $firebaseService)
    {
        parent::__construct();
        $this->firebaseService = $firebaseService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting scheduled notification process...');

        try {
            // 通知を送信するユーザーを取得（FCMトークンがあり、通知設定が有効なユーザー）
            $users = User::whereNotNull('fcm_token')
                ->whereJsonContains('notification_settings->period_notifications', true)
                ->orWhereJsonContains('notification_settings->ovulation_notifications', true)
                ->get();

            $this->info("Found {$users->count()} users to process");

            $sentCount = 0;

            foreach ($users as $user) {
                try {
                    $notifications = $this->getNotificationsForUser($user);
                    
                    foreach ($notifications as $notification) {
                        $success = $this->firebaseService->sendToToken(
                            $user->fcm_token,
                            $notification
                        );

                        if ($success) {
                            $sentCount++;
                            $user->last_notification_sent_at = now();
                            $user->save();
                        }
                    }
                } catch (\Exception $e) {
                    $this->error("Error processing user {$user->id}: {$e->getMessage()}");
                    Log::error("Notification error for user {$user->id}", [
                        'error' => $e->getMessage(),
                        'user_id' => $user->id
                    ]);
                }
            }

            $this->info("Scheduled notifications completed. Sent {$sentCount} notifications.");
            Log::info("Scheduled notifications completed", ['sent_count' => $sentCount]);

        } catch (\Exception $e) {
            $this->error("Failed to send scheduled notifications: {$e->getMessage()}");
            Log::error("Scheduled notification process failed", ['error' => $e->getMessage()]);
        }
    }

    /**
     * 特定のユーザーに送信すべき通知を取得
     */
    private function getNotificationsForUser(User $user): array
    {
        $notifications = [];
        $today = Carbon::today();
        $notificationSettings = $user->notification_settings ?? [];

        // 生理開始予定日の通知
        if ($notificationSettings['period_notifications'] ?? true) {
            $periodNotifications = $this->getPeriodNotifications($user, $today);
            $notifications = array_merge($notifications, $periodNotifications);
        }

        // 排卵日通知
        if ($notificationSettings['ovulation_notifications'] ?? true) {
            $ovulationNotifications = $this->getOvulationNotifications($user, $today);
            $notifications = array_merge($notifications, $ovulationNotifications);
        }

        return $notifications;
    }

    /**
     * 生理関連の通知を取得
     */
    private function getPeriodNotifications(User $user, Carbon $today): array
    {
        $notifications = [];

        // 最新の生理周期を取得
        $latestCycle = MenstrualCycle::where('user_id', $user->id)
            ->latest('start_date')
            ->first();

        if (!$latestCycle) {
            return $notifications;
        }

        // 次回生理開始予定日の計算
        $averageCycleLength = $this->getAverageCycleLength($user);
        $nextPeriodStart = Carbon::parse($latestCycle->start_date)->addDays($averageCycleLength);

        // 明日が生理開始予定日の場合
        if ($nextPeriodStart->isToday() || $nextPeriodStart->isTomorrow()) {
            $notifications[] = [
                'title' => '生理開始予定日のお知らせ',
                'body' => $nextPeriodStart->isToday() ? 
                    '今日は生理開始予定日です。' : 
                    '明日は生理開始予定日です。準備をしておきましょう。',
                'type' => 'period',
                'priority' => 'high',
                'click_action' => '/calendar'
            ];
        }

        // 生理が遅れている場合（3日以上）
        if ($nextPeriodStart->addDays(3)->isPast() && !$latestCycle->end_date) {
            $daysLate = $today->diffInDays($nextPeriodStart);
            $notifications[] = [
                'title' => '生理記録のリマインダー',
                'body' => "生理予定日から{$daysLate}日経過しています。記録をご確認ください。",
                'type' => 'period',
                'priority' => 'medium',
                'click_action' => '/calendar'
            ];
        }

        return $notifications;
    }

    /**
     * 排卵日関連の通知を取得
     */
    private function getOvulationNotifications(User $user, Carbon $today): array
    {
        $notifications = [];

        // 最新の生理周期を取得
        $latestCycle = MenstrualCycle::where('user_id', $user->id)
            ->latest('start_date')
            ->first();

        if (!$latestCycle) {
            return $notifications;
        }

        $averageCycleLength = $this->getAverageCycleLength($user);
        $ovulationDay = Carbon::parse($latestCycle->start_date)->addDays($averageCycleLength - 14);

        // 今日が排卵日予測の場合
        if ($ovulationDay->isToday()) {
            $notifications[] = [
                'title' => '排卵日予測',
                'body' => '今日は排卵日の予測です。',
                'type' => 'ovulation',
                'priority' => 'medium',
                'click_action' => '/calendar'
            ];
        }

        // 妊娠しやすい期間の開始（排卵日の5日前）
        if ($ovulationDay->copy()->subDays(5)->isToday()) {
            $notifications[] = [
                'title' => '妊娠しやすい期間',
                'body' => '妊娠しやすい期間に入りました。',
                'type' => 'fertile_window',
                'priority' => 'medium',
                'click_action' => '/calendar'
            ];
        }

        return $notifications;
    }

    /**
     * ユーザーの平均生理周期を取得
     */
    private function getAverageCycleLength(User $user): int
    {
        $cycles = MenstrualCycle::where('user_id', $user->id)
            ->whereNotNull('end_date')
            ->orderBy('start_date', 'desc')
            ->take(6) // 最近6周期を使用
            ->get();

        if ($cycles->count() < 2) {
            return 28; // デフォルト値
        }

        $totalLength = 0;
        for ($i = 0; $i < $cycles->count() - 1; $i++) {
            $current = Carbon::parse($cycles[$i]->start_date);
            $next = Carbon::parse($cycles[$i + 1]->start_date);
            $totalLength += $current->diffInDays($next);
        }

        return (int) round($totalLength / ($cycles->count() - 1));
    }
}