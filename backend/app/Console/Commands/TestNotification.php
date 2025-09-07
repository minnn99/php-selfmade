<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FirebaseService;
use App\Models\User;

class TestNotification extends Command
{
    protected $signature = 'notification:test {user_id}';
    protected $description = 'Send test notification to a specific user';

    public function __construct(
        private FirebaseService $firebaseService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return 1;
        }

        if (!$user->fcm_token) {
            $this->error("User {$user->name} has no FCM token");
            return 1;
        }

        $this->info("Sending test notification to {$user->name}...");

        $result = $this->firebaseService->sendToToken(
            $user->fcm_token,
            [
                'title' => 'テスト通知',
                'body' => 'これはFCMシステムのテスト通知です。正常に受信できています！',
                'type' => 'test',
                'priority' => 'high'
            ]
        );

        if ($result) {
            $this->info('✅ Notification sent successfully!');
            return 0;
        } else {
            $this->error('❌ Failed to send notification');
            return 1;
        }
    }
}