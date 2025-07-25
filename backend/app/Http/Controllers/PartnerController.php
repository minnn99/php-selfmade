<?php

namespace App\Http\Controllers;

use App\Models\PartnerRelationship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PartnerController extends Controller
{
    /**
     * 招待コード生成（女性ユーザーのみ）
     */
    public function generateInvite(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // 女性ユーザーかどうかをチェック
        if ($user->gender !== 'female' && $user->gender !== '女性') {
            return response()->json([
                'success' => false,
                'message' => '招待コードの生成は女性ユーザーのみ利用できます。'
            ], 403);
        }
        
        // 既存のアクティブな関係をチェック
        $existingRelation = PartnerRelationship::where('female_user_id', $user->id)
            ->where('status', 'connected')
            ->first();
            
        if ($existingRelation) {
            return response()->json([
                'success' => false,
                'message' => '既にパートナーと連携中です。'
            ], 400);
        }
        
        DB::beginTransaction();
        try {
            // 既存のpending状態の招待を無効化
            PartnerRelationship::where('female_user_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'disconnected']);
            
            // 新しい招待コードを生成
            $inviteCode = PartnerRelationship::generateInviteCode();
            
            $relationship = PartnerRelationship::create([
                'female_user_id' => $user->id,
                'invite_code' => $inviteCode,
                'status' => 'pending'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'invite_code' => $inviteCode,
                    'expires_at' => now()->addDays(7)->toISOString() // 7日間有効
                ],
                'message' => '招待コードが生成されました。'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => '招待コードの生成に失敗しました。'
            ], 500);
        }
    }

    /**
     * 招待コードで参加（男性ユーザーのみ）
     */
    public function joinPartner(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // 男性ユーザーかどうかをチェック
        if ($user->gender !== 'male' && $user->gender !== '男性') {
            return response()->json([
                'success' => false,
                'message' => 'パートナー参加は男性ユーザーのみ利用できます。'
            ], 403);
        }
        
        $request->validate([
            'invite_code' => 'required|string|size:6'
        ]);
        
        $inviteCode = strtoupper($request->input('invite_code'));
        
        // 既存のアクティブな関係をチェック
        $existingRelation = PartnerRelationship::where('male_user_id', $user->id)
            ->where('status', 'connected')
            ->first();
            
        if ($existingRelation) {
            return response()->json([
                'success' => false,
                'message' => '既にパートナーと連携中です。'
            ], 400);
        }
        
        DB::beginTransaction();
        try {
            // 招待コードを検索
            $relationship = PartnerRelationship::where('invite_code', $inviteCode)
                ->where('status', 'pending')
                ->whereNull('male_user_id')
                ->first();
                
            if (!$relationship) {
                return response()->json([
                    'success' => false,
                    'message' => '無効な招待コードです。'
                ], 404);
            }
            
            // 自分自身との連携を防ぐ
            if ($relationship->female_user_id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => '自分自身とは連携できません。'
                ], 400);
            }
            
            // 連携を確立
            $relationship->update([
                'male_user_id' => $user->id,
                'status' => 'connected',
                'connected_at' => now()
            ]);
            
            // 女性ユーザーの情報を取得
            $femaleUser = $relationship->femaleUser;
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'partner' => [
                        'id' => $femaleUser->id,
                        'name' => $femaleUser->name,
                        'gender' => $femaleUser->gender
                    ],
                    'connected_at' => $relationship->connected_at->toISOString()
                ],
                'message' => 'パートナーとの連携が完了しました。'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'パートナー連携に失敗しました。'
            ], 500);
        }
    }

    /**
     * パートナー関係の状況取得
     */
    public function getStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $relationship = PartnerRelationship::where(function ($query) use ($user) {
            $query->where('female_user_id', $user->id)
                  ->orWhere('male_user_id', $user->id);
        })
        ->where('status', 'connected')
        ->with(['femaleUser', 'maleUser'])
        ->first();
        
        if (!$relationship) {
            return response()->json([
                'success' => true,
                'data' => [
                    'is_connected' => false,
                    'partner' => null
                ]
            ]);
        }
        
        $partner = $relationship->getPartnerUser($user->id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'is_connected' => true,
                'partner' => [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'gender' => $partner->gender
                ],
                'connected_at' => $relationship->connected_at->toISOString(),
                'user_role' => $user->id === $relationship->female_user_id ? 'inviter' : 'joiner'
            ]
        ]);
    }

    /**
     * パートナー関係の解除
     */
    public function disconnect(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $relationship = PartnerRelationship::where(function ($query) use ($user) {
            $query->where('female_user_id', $user->id)
                  ->orWhere('male_user_id', $user->id);
        })
        ->where('status', 'connected')
        ->first();
        
        if (!$relationship) {
            return response()->json([
                'success' => false,
                'message' => '連携中のパートナーが見つかりません。'
            ], 404);
        }
        
        $relationship->update([
            'status' => 'disconnected'
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'パートナーとの連携を解除しました。'
        ]);
    }

    /**
     * パートナーのカレンダーデータを取得
     */
    public function getPartnerCalendar(Request $request): JsonResponse
    {
        $user = $request->user();
        
        \Log::info('PartnerCalendar: Request from user', ['user_id' => $user->id, 'user_gender' => $user->gender]);
        
        // パートナー関係を取得
        $relationship = PartnerRelationship::where(function ($query) use ($user) {
            $query->where('female_user_id', $user->id)
                  ->orWhere('male_user_id', $user->id);
        })
        ->where('status', 'connected')
        ->with(['femaleUser', 'maleUser'])
        ->first();
        
        \Log::info('PartnerCalendar: Relationship found', ['relationship' => $relationship ? $relationship->toArray() : null]);
        
        if (!$relationship) {
            \Log::warning('PartnerCalendar: No relationship found for user', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'パートナーとの連携が見つかりません。'
            ], 404);
        }
        
        // パートナーユーザーを取得（現在のユーザーの相手）
        $partnerUser = $relationship->getPartnerUser($user->id);
        
        if (!$partnerUser) {
            \Log::error('PartnerCalendar: Partner user not found', ['relationship_id' => $relationship->id, 'user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'パートナー情報が見つかりません。'
            ], 404);
        }
        
        \Log::info('PartnerCalendar: Partner user found', ['partner_id' => $partnerUser->id, 'partner_name' => $partnerUser->name]);
        
        // 年月のパラメータを取得
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('n'));
        
        try {
            // パートナーの生理周期データを取得（MenstrualCycleControllerのロジックを流用）
            $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();
            
            // パートナーの生理周期データを取得
            $cycles = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
                ->where(function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate])
                          ->orWhere(function ($q) use ($startDate, $endDate) {
                              $q->where('start_date', '<=', $startDate)
                                ->where(function ($qq) use ($endDate) {
                                    $qq->where('end_date', '>=', $endDate)
                                       ->orWhereNull('end_date');
                                });
                          });
                })
                ->orderBy('start_date')
                ->get();
                
            \Log::info('PartnerCalendar: Cycles found', [
                'partner_id' => $partnerUser->id, 
                'cycles_count' => $cycles->count(),
                'year' => $year,
                'month' => $month,
                'cycles' => $cycles->toArray()
            ]);
            
            // カレンダー用のデータ構造に変換
            $calendarData = [];
            
            foreach ($cycles as $cycle) {
                $cycleStart = \Carbon\Carbon::parse($cycle->start_date);
                $cycleEnd = $cycle->end_date ? \Carbon\Carbon::parse($cycle->end_date) : null;
                
                // 生理期間の日付を設定
                $current = $cycleStart->copy();
                while ($current->month == $month && $current->year == $year) {
                    if ($cycleEnd && $current->gt($cycleEnd)) {
                        break;
                    }
                    
                    $dateKey = $current->format('Y-m-d');
                    $dayOfCycle = $current->diffInDays($cycleStart) + 1;
                    
                    // パートナー（女性）の日次症状データを取得
                    $dailySymptoms = \App\Models\DailySymptom::where('user_id', $partnerUser->id)
                        ->where('symptom_date', $dateKey)
                        ->first();
                    
                    $calendarData[$dateKey] = [
                        'date' => $dateKey,
                        'status' => $cycleEnd || $dayOfCycle <= 7 ? 'period' : 'cycle',
                        'day_of_cycle' => $dayOfCycle,
                        'flow_intensity' => $cycle->flow_intensity ?? 2,
                        'symptoms' => $cycle->symptoms ?? [],
                        'notes' => $cycle->notes,
                        'is_partner_data' => true,
                        'partner_name' => $partnerUser->name,
                        // パートナーの日次データを追加
                        'partner_daily_data' => $dailySymptoms ? [
                            'symptoms' => $dailySymptoms->symptoms_data['symptoms'] ?? [],
                            'mood' => $dailySymptoms->symptoms_data['mood'] ?? '',
                            'health_notes' => $dailySymptoms->symptoms_data['healthNotes'] ?? '',
                            'flow_intensity' => $dailySymptoms->symptoms_data['flowIntensity'] ?? null,
                        ] : null
                    ];
                    
                    $current->addDay();
                    
                    // 生理終了日を過ぎたら抜ける
                    if ($cycleEnd && $current->gt($cycleEnd)) {
                        break;
                    }
                    
                    // 7日を超えたら生理期間終了とみなす（end_dateがない場合）
                    if (!$cycleEnd && $dayOfCycle >= 7) {
                        break;
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'calendar_data' => array_values($calendarData),
                    'partner_info' => [
                        'id' => $partnerUser->id,
                        'name' => $partnerUser->name,
                        'gender' => $partnerUser->gender
                    ],
                    'year' => (int)$year,
                    'month' => (int)$month
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('PartnerCalendar: Exception occurred', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'パートナーのカレンダーデータの取得に失敗しました。',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }
}
