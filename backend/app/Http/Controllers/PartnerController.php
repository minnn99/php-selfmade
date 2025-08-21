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
        
        // パートナー関係を取得
        $relationship = PartnerRelationship::where(function ($query) use ($user) {
            $query->where('female_user_id', $user->id)
                  ->orWhere('male_user_id', $user->id);
        })
        ->where('status', 'connected')
        ->with(['femaleUser', 'maleUser'])
        ->first();
        
        if (!$relationship) {
            return response()->json([
                'success' => false,
                'message' => 'パートナーとの連携が見つかりません。'
            ], 404);
        }
        
        // パートナーユーザーを取得（現在のユーザーの相手）
        $partnerUser = $relationship->getPartnerUser($user->id);
        
        if (!$partnerUser) {
            return response()->json([
                'success' => false,
                'message' => 'パートナー情報が見つかりません。'
            ], 404);
        }
        
        // 年月のパラメータを取得
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('n'));
        
        try {
            // 女性側のMenstrualCycleControllerと完全に同じロジックを使用
            
            // MenstrualCycleController::getCalendarDataと同じロジック
            $startOfMonth = \Carbon\Carbon::create($year, $month, 1);
            $endOfMonth = $startOfMonth->copy()->endOfMonth();
            
            // アクティブな周期がある場合は次月の最初の数日も含める
            $activeCycle = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
                ->whereNull('end_date')
                ->first();
            
            $extendedEndOfMonth = $endOfMonth;
            if ($activeCycle) {
                $predictedEndDate = $activeCycle->start_date->copy()->addDays(4);
                if ($predictedEndDate > $endOfMonth) {
                    $extendedEndOfMonth = $predictedEndDate;
                }
            }
            
            // 周期データを取得
            $cycles = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
                ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                    $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                        ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                        ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                            $q->where('start_date', '<=', $startOfMonth)
                                ->where(function ($qq) use ($endOfMonth) {
                                    $qq->where('end_date', '>=', $endOfMonth)
                                       ->orWhereNull('end_date');
                                });
                        });
                })
                ->get();
            
            $calendarData = [];
            
            // 実際の周期データを処理
            foreach ($cycles as $cycle) {
                if ($cycle->end_date === null) {
                    // アクティブな周期の処理
                    $predictedEndDate = $cycle->start_date->copy()->addDays(4);
                    $today = \Carbon\Carbon::today();
                    
                    for ($date = $cycle->start_date->copy(); $date <= $predictedEndDate; $date->addDay()) {
                        if ($date >= $startOfMonth && $date <= $extendedEndOfMonth) {
                            $isStartDate = $date->format('Y-m-d') === $cycle->start_date->format('Y-m-d');
                            $isPastOrToday = $date <= $today;
                            
                            $calendarData[$date->format('Y-m-d')] = [
                                'date' => $date->format('Y-m-d'),
                                'hasPeriod' => $isPastOrToday,
                                'isPeriodStart' => $isStartDate,
                                'isPeriodEnd' => false,
                                'isActive' => true,
                                'isPredictedPeriod' => !$isPastOrToday,
                                'isOvulation' => false,
                                'isFertile' => false,
                                'flowIntensity' => $isStartDate ? $cycle->flow_intensity : null,
                                'symptoms' => $isStartDate ? $cycle->symptoms : [],
                                'cycleId' => $cycle->id,
                                'notes' => $isStartDate ? $cycle->notes : null,
                                'is_partner_data' => true,
                                'partner_name' => $partnerUser->name
                            ];
                        }
                    }
                } else {
                    // 完了した周期の処理
                    $start = max($cycle->start_date, $startOfMonth);
                    $end = min($cycle->end_date, $endOfMonth);
                    
                    for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                        $isStartDate = $date->format('Y-m-d') === $cycle->start_date->format('Y-m-d');
                        $isEndDate = $date->format('Y-m-d') === $cycle->end_date->format('Y-m-d');
                        
                        $calendarData[$date->format('Y-m-d')] = [
                            'date' => $date->format('Y-m-d'),
                            'hasPeriod' => true,
                            'isPeriodStart' => $isStartDate,
                            'isPeriodEnd' => $isEndDate,
                            'isActive' => false,
                            'isPredictedPeriod' => false,
                            'isOvulation' => false,
                            'isFertile' => false,
                            'flowIntensity' => $cycle->flow_intensity,
                            'symptoms' => $cycle->symptoms ?? [],
                            'cycleId' => $cycle->id,
                            'notes' => $cycle->notes,
                            'is_partner_data' => true,
                            'partner_name' => $partnerUser->name
                        ];
                    }
                }
            }
            
            // 予測データを追加
            $predictions = $this->calculatePredictionsForPartner($partnerUser, $startOfMonth, $extendedEndOfMonth);
            $calendarData = array_merge($calendarData, $predictions);
            
            // パートナーの日別症状データを取得して追加
            $dailySymptoms = \App\Models\DailySymptom::where('user_id', $partnerUser->id)
                ->whereBetween('symptom_date', [$startOfMonth, $endOfMonth])
                ->get();
            
            // 日別症状データをカレンダーデータに統合
            foreach ($dailySymptoms as $symptom) {
                $date = $symptom->symptom_date->format('Y-m-d');
                $symptomsData = $symptom->symptoms_data ?? [];
                
                // 既存のカレンダーデータがある場合は追加、ない場合は新規作成
                if (!isset($calendarData[$date])) {
                    $calendarData[$date] = [
                        'date' => $date,
                        'hasPeriod' => false,
                        'isPeriodStart' => false,
                        'isPeriodEnd' => false,
                        'isActive' => false,
                        'isPredictedPeriod' => false,
                        'isOvulation' => false,
                        'isFertile' => false,
                        'flowIntensity' => null,
                        'symptoms' => [],
                        'cycleId' => null,
                        'notes' => null,
                        'is_partner_data' => true,
                        'partner_name' => $partnerUser->name
                    ];
                }
                
                // パートナーの日別症状データを追加
                $calendarData[$date]['partner_daily_data'] = [
                    'symptoms' => $symptomsData['symptoms'] ?? [],
                    'mood' => $symptomsData['mood'] ?? '',
                    'health_notes' => $symptomsData['healthNotes'] ?? '',
                    'flow_intensity' => $symptomsData['flowIntensity'] ?? null
                ];
            }
            
            // 表示月範囲内のデータのみにフィルタリング
            $filteredData = [];
            foreach ($calendarData as $date => $data) {
                $dateObj = \Carbon\Carbon::parse($date);
                if ($dateObj >= $startOfMonth && $dateObj <= $endOfMonth) {
                    $filteredData[$date] = $data;
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'calendar_data' => array_values($filteredData),
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
            return response()->json([
                'success' => false,
                'message' => 'パートナーのカレンダーデータの取得に失敗しました。',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * パートナー用の予測計算（MenstrualCycleControllerと同じロジック）
     */
    private function calculatePredictionsForPartner($partnerUser, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        // アクティブな周期をチェック
        $activeCycle = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
            ->whereNull('end_date')
            ->first();
        
        // 過去6ヶ月の完了した周期を取得
        $completedCycles = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
            ->whereNotNull('end_date')
            ->where('start_date', '>=', now()->subMonths(6))
            ->orderBy('start_date', 'desc')
            ->limit(6)
            ->get();

        // アクティブな周期がある場合とない場合で処理を分ける
        if ($activeCycle) {
            return $this->calculatePredictionsWithActiveCycleForPartner($activeCycle, $completedCycles, $startOfMonth, $endOfMonth);
        }

        if ($completedCycles->count() < 2) {
            return $this->calculateDefaultPredictionsForPartner($partnerUser, $startOfMonth, $endOfMonth);
        }

        // 周期の長さを計算
        $cycleLengths = [];
        for ($i = 0; $i < $completedCycles->count() - 1; $i++) {
            $currentCycle = $completedCycles[$i];
            $previousCycle = $completedCycles[$i + 1];
            
            $cycleLength = $previousCycle->start_date->diffInDays($currentCycle->start_date);
            
            if ($cycleLength > 0 && $cycleLength <= 50) {
                $cycleLengths[] = $cycleLength;
            }
        }

        if (empty($cycleLengths)) {
            return $this->calculateDefaultPredictionsForPartner($partnerUser, $startOfMonth, $endOfMonth);
        }

        // 平均周期長を計算
        $averageCycleLength = round(array_sum($cycleLengths) / count($cycleLengths));
        
        // 最後の生理終了日から次回予測
        $lastCycle = $completedCycles->first();
        $nextPredictedStart = $lastCycle->end_date->copy()->addDays($averageCycleLength - 5);

        // 完了した周期の排卵日予測を追加
        for ($i = 1; $i < $completedCycles->count(); $i++) {
            $nextCycleStart = $completedCycles[$i - 1]->start_date;
            
            $ovulationDate = $nextCycleStart->copy()->subDays(14);
            if ($ovulationDate >= $startOfMonth && $ovulationDate <= $endOfMonth) {
                $this->addOvulationPredictionForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
                $this->addFertilePeriodForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            }
        }
        
        // 次回予測生理の排卵日予測を追加
        $nextOvulationDate = $nextPredictedStart->copy()->subDays(14);
        if ($nextOvulationDate >= $startOfMonth && $nextOvulationDate <= $endOfMonth) {
            $this->addOvulationPredictionForPartner($predictions, $nextOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriodForPartner($predictions, $nextOvulationDate, $startOfMonth, $endOfMonth);
        }

        // 今月と来月の予測を生成
        for ($i = 0; $i < 3; $i++) {
            $predictedStart = $nextPredictedStart->copy()->addDays($averageCycleLength * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5);
            
            $this->addPredictedPeriodForPartner($predictions, $predictedStart, $predictedEnd, $startOfMonth, $endOfMonth);
            
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPredictionForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriodForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
        }

        return $predictions;
    }

    private function calculatePredictionsWithActiveCycleForPartner($activeCycle, $completedCycles, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        $averageCycleLength = 28;
        
        if ($completedCycles->count() >= 1) {
            $cycleLengths = [];
            for ($i = 0; $i < $completedCycles->count() - 1; $i++) {
                $currentCycle = $completedCycles[$i];
                $previousCycle = $completedCycles[$i + 1];
                
                $cycleLength = $previousCycle->start_date->diffInDays($currentCycle->start_date);
                
                if ($cycleLength > 0 && $cycleLength <= 50) {
                    $cycleLengths[] = $cycleLength;
                }
            }
            
            if (!empty($cycleLengths)) {
                $averageCycleLength = round(array_sum($cycleLengths) / count($cycleLengths));
            }
        }
        
        // 前回周期の排卵日予測を保持
        $previousOvulationDate = $activeCycle->start_date->copy()->subDays(14);
        if ($previousOvulationDate >= $startOfMonth && $previousOvulationDate <= $endOfMonth) {
            $this->addOvulationPredictionForPartner($predictions, $previousOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriodForPartner($predictions, $previousOvulationDate, $startOfMonth, $endOfMonth);
        }
        
        $nextPredictedStart = $activeCycle->start_date->copy()->addDays($averageCycleLength);
        
        $newOvulationDate = $nextPredictedStart->copy()->subDays(14);
        if ($newOvulationDate >= $startOfMonth && $newOvulationDate <= $endOfMonth) {
            $this->addOvulationPredictionForPartner($predictions, $newOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriodForPartner($predictions, $newOvulationDate, $startOfMonth, $endOfMonth);
        }
        
        // 将来の予測を生成
        for ($i = 0; $i < 3; $i++) {
            $predictedStart = $nextPredictedStart->copy()->addDays($averageCycleLength * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5);
            
            $extendedEndOfMonth = $endOfMonth;
            if ($i == 0) {
                $extendedEndOfMonth = $endOfMonth->copy()->addDays(7);
            }
            
            $this->addPredictedPeriodForPartner($predictions, $predictedStart, $predictedEnd, $startOfMonth, $extendedEndOfMonth);
            
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPredictionForPartner($predictions, $ovulationDate, $startOfMonth, $extendedEndOfMonth);
            $this->addFertilePeriodForPartner($predictions, $ovulationDate, $startOfMonth, $extendedEndOfMonth);
        }
        
        return $predictions;
    }

    private function calculateDefaultPredictionsForPartner($partnerUser, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        $completedCycles = \App\Models\MenstrualCycle::where('user_id', $partnerUser->id)
            ->whereNotNull('end_date')
            ->orderBy('start_date', 'desc')
            ->limit(3)
            ->get();

        if ($completedCycles->isEmpty()) {
            return $predictions;
        }
        
        $lastCycle = $completedCycles->first();

        $nextPredictedStart = $lastCycle->end_date ? 
            $lastCycle->end_date->copy()->addDays(23) :
            $lastCycle->start_date->copy()->addDays(28);
        
        // 完了した周期の排卵日予測を追加
        for ($i = 1; $i < $completedCycles->count(); $i++) {
            $nextCycleStart = $completedCycles[$i - 1]->start_date;
            
            $ovulationDate = $nextCycleStart->copy()->subDays(14);
            if ($ovulationDate >= $startOfMonth && $ovulationDate <= $endOfMonth) {
                $this->addOvulationPredictionForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
                $this->addFertilePeriodForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            }
        }
        
        for ($i = 0; $i < 3; $i++) {
            $predictedStart = $nextPredictedStart->copy()->addDays(28 * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5);
            
            $this->addPredictedPeriodForPartner($predictions, $predictedStart, $predictedEnd, $startOfMonth, $endOfMonth);
            
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPredictionForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriodForPartner($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
        }

        return $predictions;
    }

    private function addPredictedPeriodForPartner(&$predictions, $startDate, $endDate, $monthStart, $monthEnd)
    {
        $start = max($startDate, $monthStart);
        $end = min($endDate, $monthEnd);
        
        if ($start <= $end && $start >= $monthStart && $start <= $monthEnd) {
            for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                $dateKey = $date->format('Y-m-d');
                
                if (!isset($predictions[$dateKey])) {
                    $predictions[$dateKey] = [
                        'date' => $dateKey,
                        'hasPeriod' => false,
                        'isPeriodStart' => false,
                        'isPeriodEnd' => false,
                        'isActive' => false,
                        'isPredictedPeriod' => true,
                        'isOvulation' => false,
                        'isFertile' => false,
                        'flowIntensity' => null,
                        'symptoms' => [],
                        'cycleId' => null,
                        'notes' => null,
                        'is_partner_data' => true
                    ];
                }
            }
        }
    }

    private function addOvulationPredictionForPartner(&$predictions, $ovulationDate, $monthStart, $monthEnd)
    {
        if ($ovulationDate >= $monthStart && $ovulationDate <= $monthEnd) {
            $dateKey = $ovulationDate->format('Y-m-d');
            
            if (!isset($predictions[$dateKey])) {
                $predictions[$dateKey] = [
                    'date' => $dateKey,
                    'hasPeriod' => false,
                    'isPeriodStart' => false,
                    'isPeriodEnd' => false,
                    'isActive' => false,
                    'isPredictedPeriod' => false,
                    'isOvulation' => true,
                    'isFertile' => false,
                    'flowIntensity' => null,
                    'symptoms' => [],
                    'cycleId' => null,
                    'notes' => null,
                    'is_partner_data' => true
                ];
            } else {
                $predictions[$dateKey]['isOvulation'] = true;
            }
        }
    }

    private function addFertilePeriodForPartner(&$predictions, $ovulationDate, $monthStart, $monthEnd)
    {
        for ($i = -5; $i <= 5; $i++) {
            $fertileDate = $ovulationDate->copy()->addDays($i);
            
            if ($fertileDate >= $monthStart && $fertileDate <= $monthEnd) {
                $dateKey = $fertileDate->format('Y-m-d');
                
                if (!isset($predictions[$dateKey])) {
                    $predictions[$dateKey] = [
                        'date' => $dateKey,
                        'hasPeriod' => false,
                        'isPeriodStart' => false,
                        'isPeriodEnd' => false,
                        'isActive' => false,
                        'isPredictedPeriod' => false,
                        'isOvulation' => false,
                        'isFertile' => true,
                        'flowIntensity' => null,
                        'symptoms' => [],
                        'cycleId' => null,
                        'notes' => null,
                        'is_partner_data' => true
                    ];
                } else {
                    $predictions[$dateKey]['isFertile'] = true;
                }
            }
        }
    }
}
