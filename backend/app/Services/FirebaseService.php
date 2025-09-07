<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Contract\Messaging;
use Illuminate\Support\Facades\Log;

class FirebaseService
{
    private ?Messaging $messaging = null;

    public function __construct()
    {
        $credentials = config('firebase.credentials');
        
        // Firebase認証情報が設定されていない場合はスキップ（Docker構築時など）
        if ($credentials === null || $credentials === '') {
            Log::warning('Firebase credentials not configured. FirebaseService will not be available.');
            return;
        }

        $factory = (new Factory)
            ->withServiceAccount($credentials)
            ->withDatabaseUri(config('firebase.database_url'));

        $this->messaging = $factory->createMessaging();
    }

    /**
     * 特定のFCMトークンに通知を送信
     */
    public function sendToToken(string $token, array $data): bool
    {
        // Firebase認証情報が設定されていない場合はスキップ
        if ($this->messaging === null) {
            Log::warning('Firebase messaging not initialized. Cannot send notification.');
            return false;
        }
        
        try {
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification(Notification::create(
                    $data['title'] ?? 'お知らせ',
                    $data['body'] ?? ''
                ))
                ->withData([
                    'type' => $data['type'] ?? 'system',
                    'priority' => $data['priority'] ?? 'medium',
                    'click_action' => $data['click_action'] ?? '/',
                    'timestamp' => now()->toISOString(),
                ]);

            $this->messaging->send($message);
            
            Log::info('FCM notification sent successfully', [
                'token' => substr($token, 0, 20) . '...',
                'title' => $data['title'] ?? 'お知らせ',
                'type' => $data['type'] ?? 'system'
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('FCM notification failed', [
                'error' => $e->getMessage(),
                'token' => substr($token, 0, 20) . '...',
                'data' => $data
            ]);

            return false;
        }
    }

    /**
     * 複数のFCMトークンに通知を送信
     */
    public function sendToMultipleTokens(array $tokens, array $data): array
    {
        $results = [];
        
        // Firebase認証情報が設定されていない場合はスキップ
        if ($this->messaging === null) {
            Log::warning('Firebase messaging not initialized. Cannot send notifications.');
            return $results;
        }
        
        try {
            $message = CloudMessage::new()
                ->withNotification(Notification::create(
                    $data['title'] ?? 'お知らせ',
                    $data['body'] ?? ''
                ))
                ->withData([
                    'type' => $data['type'] ?? 'system',
                    'priority' => $data['priority'] ?? 'medium',
                    'click_action' => $data['click_action'] ?? '/',
                    'timestamp' => now()->toISOString(),
                ]);

            $response = $this->messaging->sendMulticast($message, $tokens);

            $successTokens = [];
            foreach ($response->successes() as $result) {
                $successTokens[] = $result->target()->value();
            }
            
            $failedTokens = [];
            foreach ($response->failures() as $result) {
                $failedTokens[] = [
                    'token' => $result->target()->value(),
                    'error' => $result->error()->getMessage()
                ];
            }
            
            $results = [
                'success_count' => $response->successes()->count(),
                'failure_count' => $response->failures()->count(),
                'success_tokens' => $successTokens,
                'failed_tokens' => $failedTokens
            ];

            Log::info('FCM multicast notification completed', $results);

        } catch (\Exception $e) {
            Log::error('FCM multicast notification failed', [
                'error' => $e->getMessage(),
                'token_count' => count($tokens),
                'data' => $data
            ]);

            $results = [
                'success_count' => 0,
                'failure_count' => count($tokens),
                'error' => $e->getMessage()
            ];
        }

        return $results;
    }

    /**
     * トピックに通知を送信
     */
    public function sendToTopic(string $topic, array $data): bool
    {
        if ($this->messaging === null) {
            Log::warning('Firebase messaging not initialized. Cannot send topic notification.');
            return false;
        }
        
        try {
            $message = CloudMessage::withTarget('topic', $topic)
                ->withNotification(Notification::create(
                    $data['title'] ?? 'お知らせ',
                    $data['body'] ?? ''
                ))
                ->withData([
                    'type' => $data['type'] ?? 'system',
                    'priority' => $data['priority'] ?? 'medium',
                    'click_action' => $data['click_action'] ?? '/',
                    'timestamp' => now()->toISOString(),
                ]);

            $this->messaging->send($message);
            
            Log::info('FCM topic notification sent successfully', [
                'topic' => $topic,
                'title' => $data['title'] ?? 'お知らせ',
                'type' => $data['type'] ?? 'system'
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('FCM topic notification failed', [
                'error' => $e->getMessage(),
                'topic' => $topic,
                'data' => $data
            ]);

            return false;
        }
    }

    /**
     * 生理周期通知を送信
     */
    public function sendPeriodNotification(string $token, string $type, \DateTime $date): bool
    {
        $titles = [
            'period_start' => '生理開始予定日',
            'period_reminder' => '生理記録のリマインダー',
            'ovulation' => '排卵日予測',
            'fertile_window' => '妊娠しやすい期間',
        ];

        $bodies = [
            'period_start' => '明日は生理開始予定日です。準備をしておきましょう。',
            'period_reminder' => '生理が始まったら記録を忘れずに！',
            'ovulation' => '今日は排卵日の予測です。',
            'fertile_window' => '妊娠しやすい期間に入りました。',
        ];

        return $this->sendToToken($token, [
            'title' => $titles[$type] ?? 'お知らせ',
            'body' => $bodies[$type] ?? '',
            'type' => 'period',
            'priority' => 'high',
            'click_action' => '/calendar',
            'date' => $date->format('Y-m-d')
        ]);
    }

    /**
     * パートナー通知を送信
     */
    public function sendPartnerNotification(string $token, string $message, string $partnerName): bool
    {
        return $this->sendToToken($token, [
            'title' => 'パートナーからのお知らせ',
            'body' => $partnerName . 'さんから: ' . $message,
            'type' => 'partner',
            'priority' => 'medium',
            'click_action' => '/partner'
        ]);
    }

    /**
     * システム通知を送信
     */
    public function sendSystemNotification(string $token, string $title, string $body): bool
    {
        return $this->sendToToken($token, [
            'title' => $title,
            'body' => $body,
            'type' => 'system',
            'priority' => 'low',
            'click_action' => '/notifications'
        ]);
    }
}