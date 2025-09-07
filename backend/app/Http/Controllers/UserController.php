<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * FCMトークンを保存
     */
    public function storeFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcmToken' => 'required|string|max:255'
        ]);

        $user = $request->user();
        $user->fcm_token = $request->fcmToken;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'FCMトークンが保存されました'
        ]);
    }

    /**
     * FCMトークンを削除（ログアウト時など）
     */
    public function removeFcmToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->fcm_token = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'FCMトークンが削除されました'
        ]);
    }

    /**
     * 通知設定を更新
     */
    public function updateNotificationSettings(Request $request): JsonResponse
    {
        $request->validate([
            'period_notifications' => 'boolean',
            'ovulation_notifications' => 'boolean',
            'partner_notifications' => 'boolean',
            'system_notifications' => 'boolean',
        ]);

        $user = $request->user();
        $user->notification_settings = [
            'period_notifications' => $request->boolean('period_notifications', true),
            'ovulation_notifications' => $request->boolean('ovulation_notifications', true),
            'partner_notifications' => $request->boolean('partner_notifications', true),
            'system_notifications' => $request->boolean('system_notifications', true),
        ];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => '通知設定が更新されました',
            'data' => [
                'notification_settings' => $user->notification_settings
            ]
        ]);
    }

    /**
     * 通知設定を取得
     */
    public function getNotificationSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'notification_settings' => $user->notification_settings ?? [
                    'period_notifications' => true,
                    'ovulation_notifications' => true,
                    'partner_notifications' => true,
                    'system_notifications' => true,
                ]
            ]
        ]);
    }
}