<?php

namespace App\Http\Controllers;

use App\Models\MenstrualCycle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MenstrualCycleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $cycles = $user->menstrualCycles()
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json($cycles);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'flow_intensity' => 'nullable|integer|min:1|max:5',
            'symptoms' => 'nullable|array',
            'notes' => 'nullable|string|max:1000'
        ]);

        $user = $request->user();

        // Check if there's an active cycle
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->first();

        if ($activeCycle) {
            return response()->json([
                'message' => 'There is already an active menstrual cycle. Please end it first.'
            ], 400);
        }

        $cycle = $user->menstrualCycles()->create([
            'start_date' => $request->start_date,
            'flow_intensity' => $request->flow_intensity,
            'symptoms' => $request->symptoms,
            'notes' => $request->notes
        ]);

        // 新しい生理周期が追加された場合は予測データを再計算
        $this->clearPredictionCache($user);

        return response()->json($cycle, 201);
    }

    public function end(Request $request): JsonResponse
    {
        $request->validate([
            'end_date' => 'required|date',
        ]);

        $user = $request->user();
        $endDate = Carbon::parse($request->end_date);

        // 最新のアクティブな周期を取得（月をまたいで検索）
        $cycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->orderBy('start_date', 'desc')
            ->first();

        if (!$cycle) {
            // デバッグ用: 全ての周期を確認
            $allCycles = $user->menstrualCycles()
                ->orderBy('start_date', 'desc')
                ->get()
                ->map(function($c) {
                    return [
                        'id' => $c->id,
                        'start_date' => $c->start_date->format('Y-m-d'),
                        'end_date' => $c->end_date ? $c->end_date->format('Y-m-d') : null,
                        'is_active' => $c->end_date === null
                    ];
                });

            return response()->json([
                'message' => '終了する生理周期が見つかりません。先に生理開始日を設定してください。',
                'debug_cycles' => $allCycles
            ], 404);
        }

        // 終了日が開始日より前でないかチェック
        if ($endDate->lt($cycle->start_date)) {
            return response()->json([
                'message' => 'End date cannot be before the start date.',
                'start_date' => $cycle->start_date->format('Y-m-d'),
                'provided_end_date' => $endDate->format('Y-m-d')
            ], 400);
        }

        $cycle->update(['end_date' => $endDate]);

        // 生理周期が終了された場合は予測データを再計算
        $this->clearPredictionCache($user);

        return response()->json($cycle);
    }

    public function show(Request $request, MenstrualCycle $cycle): JsonResponse
    {
        // Check if user owns this cycle
        if ($cycle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($cycle);
    }

    public function update(Request $request, MenstrualCycle $cycle): JsonResponse
    {
        // Check if user owns this cycle
        if ($cycle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
            'flow_intensity' => 'sometimes|nullable|integer|min:1|max:5',
            'symptoms' => 'sometimes|nullable|array',
            'notes' => 'sometimes|nullable|string|max:1000'
        ]);

        $cycle->update($request->only([
            'start_date', 'end_date', 'flow_intensity', 'symptoms', 'notes'
        ]));

        // 生理周期が変更された場合は予測データを再計算
        $this->clearPredictionCache($request->user());

        return response()->json($cycle);
    }

    public function destroy(Request $request, MenstrualCycle $cycle): JsonResponse
    {
        // Check if user owns this cycle
        if ($cycle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cycle->delete();

        // 生理周期が削除された場合は予測データを再計算
        $this->clearPredictionCache($request->user());

        return response()->json(['message' => 'Cycle deleted successfully']);
    }

    public function deleteAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Delete all menstrual cycles for the current user
        $deletedCount = $user->menstrualCycles()->delete();

        // 全ての生理周期が削除された場合は予測データを再計算
        $this->clearPredictionCache($user);

        return response()->json([
            'message' => 'All menstrual cycles deleted successfully',
            'deleted_count' => $deletedCount
        ]);
    }

    public function getCalendarData(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12'
        ]);

        $user = $request->user();
        $year = $request->year;
        $month = $request->month;

        // Get start and end of the month
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        // アクティブな周期がある場合は次月の最初の数日も含める（生理期間予測のため）
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->first();
        
        $extendedEndOfMonth = $endOfMonth;
        if ($activeCycle) {
            $predictedEndDate = $activeCycle->start_date->copy()->addDays(4);
            if ($predictedEndDate > $endOfMonth) {
                $extendedEndOfMonth = $predictedEndDate; // 予測終了日まで拡張
            }
        }

        // Get cycles that overlap with this month
        $cycles = $user->menstrualCycles()
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

        // Process data for calendar display
        $calendarData = [];

        foreach ($cycles as $cycle) {
            // アクティブな周期（終了日がない）の場合
            if ($cycle->is_active) {
                // アクティブな周期の生理期間を予測（開始日から5日間）
                $predictedEndDate = $cycle->start_date->copy()->addDays(4); // 5日間（開始日含む）
                
                // 生理期間の各日をマーク
                $today = Carbon::today();
                for ($date = $cycle->start_date->copy(); $date <= $predictedEndDate; $date->addDay()) {
                    // 表示月および拡張範囲内の日付を処理
                    if ($date >= $startOfMonth && $date <= $extendedEndOfMonth) {
                        $isStartDate = $date->format('Y-m-d') === $cycle->start_date->format('Y-m-d');
                        $isEndDate = $date->format('Y-m-d') === $predictedEndDate->format('Y-m-d');
                        
                        // 今日以前の日付は確定生理日、未来の日付は予測生理日
                        $isPastOrToday = $date <= $today;
                        
                        $calendarData[$date->format('Y-m-d')] = [
                            'hasPeriod' => $isPastOrToday, // 今日以前は確定生理日
                            'isPeriodStart' => $isStartDate,
                            'isPeriodEnd' => false, // アクティブ周期では終了日を設定しない
                            'isActive' => true,
                            'isPredictedPeriod' => !$isPastOrToday, // 未来の日付のみ予測生理日
                            'isOvulation' => false,
                            'isFertile' => false,
                            'flowIntensity' => $isStartDate ? $cycle->flow_intensity : null,
                            'symptoms' => $isStartDate ? $cycle->symptoms : null,
                            'cycleId' => $cycle->id,
                            'notes' => $isStartDate ? $cycle->notes : null
                        ];
                    }
                }
                
                // アクティブな周期の情報は月をまたいでも含める（フロントエンド用）
                if ($cycle->start_date < $startOfMonth || $predictedEndDate > $endOfMonth) {
                    // 今月の最初の日にアクティブ周期の情報を含める（非表示だが検索可能）
                    $firstDayOfMonth = $startOfMonth->format('Y-m-d');
                    if (!isset($calendarData[$firstDayOfMonth])) {
                        $calendarData[$firstDayOfMonth] = [
                            'hasPeriod' => false,
                            'isPeriodStart' => false,
                            'isPeriodEnd' => false,
                            'isActive' => true,
                            'flowIntensity' => $cycle->flow_intensity,
                            'symptoms' => $cycle->symptoms,
                            'cycleId' => $cycle->id,
                            'notes' => $cycle->notes,
                            'isHiddenActiveReference' => true // フロントエンドで認識用
                        ];
                    }
                }
            } else {
                // 完了した周期（終了日がある）の場合は期間全体をマーク
                $start = max($cycle->start_date, $startOfMonth);
                $end = min($cycle->end_date, $endOfMonth);

                for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                    $isStartDate = $date->format('Y-m-d') === $cycle->start_date->format('Y-m-d');
                    $isEndDate = $date->format('Y-m-d') === $cycle->end_date->format('Y-m-d');
                    
                    $calendarData[$date->format('Y-m-d')] = [
                        'hasPeriod' => true,
                        'isPeriodStart' => $isStartDate,
                        'isPeriodEnd' => $isEndDate,
                        'isActive' => false,
                        'flowIntensity' => $cycle->flow_intensity,
                        'symptoms' => $cycle->symptoms,
                        'cycleId' => $cycle->id,
                        'notes' => $cycle->notes
                    ];
                }
            }
        }

        // 予測データを追加（拡張範囲で計算）
        $predictions = $this->calculatePredictions($user, $startOfMonth, $extendedEndOfMonth);
        $calendarData = array_merge($calendarData, $predictions);

        // 返すデータは元の月の範囲内の日付のみに制限
        $filteredData = [];
        foreach ($calendarData as $date => $data) {
            $dateObj = Carbon::parse($date);
            if ($dateObj >= $startOfMonth && $dateObj <= $endOfMonth) {
                $filteredData[$date] = $data;
            }
        }
        
        return response()->json([
            'year' => $year,
            'month' => $month,
            'data' => $filteredData
        ]);
    }

    public function getCurrentStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->first();

        $lastCycle = $user->menstrualCycles()
            ->whereNotNull('end_date')
            ->orderBy('end_date', 'desc')
            ->first();

        // 全ての周期を取得（デバッグ用）
        $allCycles = $user->menstrualCycles()
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(function($cycle) {
                return [
                    'id' => $cycle->id,
                    'start_date' => $cycle->start_date->format('Y-m-d'),
                    'end_date' => $cycle->end_date ? $cycle->end_date->format('Y-m-d') : null,
                    'is_active' => $cycle->end_date === null
                ];
            });

        $response = [
            'hasActiveCycle' => $activeCycle !== null,
            'activeCycle' => $activeCycle,
            'lastCycle' => $lastCycle,
            'daysSinceLastPeriod' => $lastCycle ? 
                Carbon::now()->diffInDays($lastCycle->end_date) : null,
            'debug_all_cycles' => $allCycles
        ];

        return response()->json($response);
    }

    public function getActiveCycleForEndDate(Request $request): JsonResponse
    {
        $request->validate([
            'end_date' => 'required|date'
        ]);

        $user = $request->user();
        $endDate = Carbon::parse($request->end_date);
        
        // 指定された終了日以前に開始され、まだ終了していない周期を取得
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->where('start_date', '<=', $endDate)
            ->orderBy('start_date', 'desc')
            ->first();

        return response()->json([
            'hasActiveCycle' => $activeCycle !== null,
            'activeCycle' => $activeCycle
        ]);
    }

    /**
     * 生理予定日・排卵日の予測を計算
     */
    private function calculatePredictions($user, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        // アクティブな周期をチェック
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->first();
        
        // 過去6ヶ月の完了した周期を取得（より正確な平均のため）
        $completedCycles = $user->menstrualCycles()
            ->whereNotNull('end_date')
            ->where('start_date', '>=', now()->subMonths(6))
            ->orderBy('start_date', 'desc')
            ->limit(6)
            ->get();


        // アクティブな周期がある場合とない場合で処理を分ける
        if ($activeCycle) {
            return $this->calculatePredictionsWithActiveCycle($user, $activeCycle, $completedCycles, $startOfMonth, $endOfMonth);
        }

        if ($completedCycles->count() < 2) {
            // データが不足している場合は標準的な28日周期を使用
            return $this->calculateDefaultPredictions($user, $startOfMonth, $endOfMonth);
        }

        // 周期の長さを計算
        $cycleLengths = [];
        for ($i = 0; $i < $completedCycles->count() - 1; $i++) {
            $currentCycle = $completedCycles[$i];
            $previousCycle = $completedCycles[$i + 1];
            
            $cycleLength = $previousCycle->start_date->diffInDays($currentCycle->start_date);
            
            if ($cycleLength > 0 && $cycleLength <= 50) { // 異常値を除外
                $cycleLengths[] = $cycleLength;
            }
        }

        if (empty($cycleLengths)) {
            return $this->calculateDefaultPredictions($user, $startOfMonth, $endOfMonth);
        }

        // 平均周期長を計算
        $averageCycleLength = round(array_sum($cycleLengths) / count($cycleLengths));
        
        // 最後の生理終了日から次回予測
        $lastCycle = $completedCycles->first();
        $nextPredictedStart = $lastCycle->end_date->copy()->addDays($averageCycleLength - 5); // 生理期間平均5日を考慮

        // 完了した周期の排卵日予測を追加（次の周期開始日の14日前）
        for ($i = 1; $i < $completedCycles->count(); $i++) {
            $currentCycle = $completedCycles[$i]; // 古い周期
            $nextCycleStart = $completedCycles[$i - 1]->start_date; // 新しい周期の開始日
            
            $ovulationDate = $nextCycleStart->copy()->subDays(14);
            if ($ovulationDate >= $startOfMonth && $ovulationDate <= $endOfMonth) {
                $this->addOvulationPrediction($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
                $this->addFertilePeriod($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            }
        }
        
        // 次回予測生理の排卵日予測を追加（次の生理の14日前）
        $nextOvulationDate = $nextPredictedStart->copy()->subDays(14);
        if ($nextOvulationDate >= $startOfMonth && $nextOvulationDate <= $endOfMonth) {
            $this->addOvulationPrediction($predictions, $nextOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriod($predictions, $nextOvulationDate, $startOfMonth, $endOfMonth);
        }

        // 今月と来月の予測を生成
        for ($i = 0; $i < 3; $i++) { // 3回分の予測
            $predictedStart = $nextPredictedStart->copy()->addDays($averageCycleLength * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5); // 平均5日間
            
            // 予測生理期間をカレンダーデータに追加
            $this->addPredictedPeriod($predictions, $predictedStart, $predictedEnd, $startOfMonth, $endOfMonth);
            
            // 排卵日予測（次の生理の14日前）
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPrediction($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            
            // 妊娠可能期間（排卵日±5日）
            $this->addFertilePeriod($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
        }

        return $predictions;
    }

    /**
     * アクティブな周期がある場合の予測を計算
     */
    private function calculatePredictionsWithActiveCycle($user, $activeCycle, $completedCycles, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        // 新しいアクティブ周期を基準にした予測を生成
        $averageCycleLength = 28; // デフォルト
        
        if ($completedCycles->count() >= 1) {
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
            
            if (!empty($cycleLengths)) {
                $averageCycleLength = round(array_sum($cycleLengths) / count($cycleLengths));
            }
        }
        
        // 前回周期の排卵日予測を保持（アクティブ周期開始の14日前）
        $previousOvulationDate = $activeCycle->start_date->copy()->subDays(14);
        if ($previousOvulationDate >= $startOfMonth && $previousOvulationDate <= $endOfMonth) {
            $this->addOvulationPrediction($predictions, $previousOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriod($predictions, $previousOvulationDate, $startOfMonth, $endOfMonth);
        }
        
        // 新しいアクティブ周期を基準にした次回生理予測
        $nextPredictedStart = $activeCycle->start_date->copy()->addDays($averageCycleLength);
        
        
        // 新しいアクティブ周期の排卵日予測（次の生理の14日前）
        $newOvulationDate = $nextPredictedStart->copy()->subDays(14);
        if ($newOvulationDate >= $startOfMonth && $newOvulationDate <= $endOfMonth) {
            $this->addOvulationPrediction($predictions, $newOvulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriod($predictions, $newOvulationDate, $startOfMonth, $endOfMonth);
        }
        
        // 将来の予測を生成
        for ($i = 0; $i < 3; $i++) {
            $predictedStart = $nextPredictedStart->copy()->addDays($averageCycleLength * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5);
            
            // アクティブ周期がある場合は、現在月の表示範囲を次月の最初の週まで拡張
            $extendedEndOfMonth = $endOfMonth;
            if ($i == 0) { // 最初の予測のみ範囲を拡張
                $extendedEndOfMonth = $endOfMonth->copy()->addDays(7); // 次月の最初の週まで拡張
            }
            
            // 予測生理期間をカレンダーデータに追加
            $this->addPredictedPeriod($predictions, $predictedStart, $predictedEnd, $startOfMonth, $extendedEndOfMonth);
            
            // 排卵日予測（各周期の生理の14日前）
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPrediction($predictions, $ovulationDate, $startOfMonth, $extendedEndOfMonth);
            $this->addFertilePeriod($predictions, $ovulationDate, $startOfMonth, $extendedEndOfMonth);
        }
        
        return $predictions;
    }

    /**
     * デフォルトの28日周期での予測
     */
    private function calculateDefaultPredictions($user, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        // 過去の完了した周期を取得
        $completedCycles = $user->menstrualCycles()
            ->whereNotNull('end_date') // 完了した周期のみ
            ->orderBy('start_date', 'desc')
            ->limit(3) // 最近の3周期
            ->get();

        if ($completedCycles->isEmpty()) {
            // データがない場合は予測なし（初回利用時は予測しない）
            return $predictions;
        }
        
        $lastCycle = $completedCycles->first();

        // 最初の生理周期から28日周期で予測
        $nextPredictedStart = $lastCycle->end_date ? 
            $lastCycle->end_date->copy()->addDays(23) : // 終了日がある場合
            $lastCycle->start_date->copy()->addDays(28); // 終了日がない場合
        
        // 完了した周期の排卵日予測を追加（次の周期開始日の14日前）
        for ($i = 1; $i < $completedCycles->count(); $i++) {
            $currentCycle = $completedCycles[$i]; // 古い周期
            $nextCycleStart = $completedCycles[$i - 1]->start_date; // 新しい周期の開始日
            
            $ovulationDate = $nextCycleStart->copy()->subDays(14);
            if ($ovulationDate >= $startOfMonth && $ovulationDate <= $endOfMonth) {
                $this->addOvulationPrediction($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
                $this->addFertilePeriod($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            }
        }
        
        for ($i = 0; $i < 3; $i++) {
            $predictedStart = $nextPredictedStart->copy()->addDays(28 * $i);
            $predictedEnd = $predictedStart->copy()->addDays(5);
            
            $this->addPredictedPeriod($predictions, $predictedStart, $predictedEnd, $startOfMonth, $endOfMonth);
            
            // 排卵日予測（次の生理の14日前）
            $ovulationDate = $predictedStart->copy()->subDays(14);
            $this->addOvulationPrediction($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
            $this->addFertilePeriod($predictions, $ovulationDate, $startOfMonth, $endOfMonth);
        }

        return $predictions;
    }

    /**
     * 予測生理期間をカレンダーデータに追加
     */
    private function addPredictedPeriod(&$predictions, $startDate, $endDate, $monthStart, $monthEnd)
    {
        // 表示月の範囲内の日付のみ処理
        $start = max($startDate, $monthStart);
        $end = min($endDate, $monthEnd);
        
        if ($start <= $end && $start >= $monthStart && $start <= $monthEnd) {
            for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                $dateKey = $date->format('Y-m-d');
                
                // 既存の実際の生理データがある場合はスキップ
                if (!isset($predictions[$dateKey])) {
                    $predictions[$dateKey] = [
                        'hasPeriod' => false,
                        'isPeriodStart' => false,
                        'isPeriodEnd' => false,
                        'isActive' => false,
                        'isPredictedPeriod' => true,
                        'isOvulation' => false,
                        'isFertile' => false,
                        'flowIntensity' => null,
                        'symptoms' => null,
                        'cycleId' => null,
                        'notes' => null
                    ];
                }
            }
        }
    }

    /**
     * 排卵日予測をカレンダーデータに追加
     */
    private function addOvulationPrediction(&$predictions, $ovulationDate, $monthStart, $monthEnd)
    {
        if ($ovulationDate >= $monthStart && $ovulationDate <= $monthEnd) {
            $dateKey = $ovulationDate->format('Y-m-d');
            
            // 既に排卵日として設定されている場合は重複を避ける
            if (isset($predictions[$dateKey]) && $predictions[$dateKey]['isOvulation'] === true) {
                return;
            }
            
            if (!isset($predictions[$dateKey])) {
                $predictions[$dateKey] = [
                    'hasPeriod' => false,
                    'isPeriodStart' => false,
                    'isPeriodEnd' => false,
                    'isActive' => false,
                    'isPredictedPeriod' => false,
                    'isOvulation' => true,
                    'isFertile' => true,
                    'flowIntensity' => null,
                    'symptoms' => null,
                    'cycleId' => null,
                    'notes' => null
                ];
            } else {
                // 既存データに排卵情報を追加
                $predictions[$dateKey]['isOvulation'] = true;
                $predictions[$dateKey]['isFertile'] = true;
            }
        }
    }

    /**
     * 妊娠可能期間をカレンダーデータに追加
     */
    private function addFertilePeriod(&$predictions, $ovulationDate, $monthStart, $monthEnd)
    {
        // 排卵日の前後5日間を妊娠可能期間とする
        $fertileStart = $ovulationDate->copy()->subDays(5);
        $fertileEnd = $ovulationDate->copy()->addDays(5);
        
        $start = max($fertileStart, $monthStart);
        $end = min($fertileEnd, $monthEnd);
        
        for ($date = $start->copy(); $date <= $end; $date->addDay()) {
            $dateKey = $date->format('Y-m-d');
            
            if (!isset($predictions[$dateKey])) {
                $predictions[$dateKey] = [
                    'hasPeriod' => false,
                    'isPeriodStart' => false,
                    'isPeriodEnd' => false,
                    'isActive' => false,
                    'isPredictedPeriod' => false,
                    'isOvulation' => false,
                    'isFertile' => true,
                    'flowIntensity' => null,
                    'symptoms' => null,
                    'cycleId' => null,
                    'notes' => null
                ];
            } else {
                // 既存データに妊娠可能期間情報を追加
                $predictions[$dateKey]['isFertile'] = true;
            }
        }
    }

    /**
     * 予測データのキャッシュをクリア（将来のキャッシュ機能実装時に使用）
     */
    private function clearPredictionCache($user)
    {
        // 現在はキャッシュ機能がないため、何もしない
        // 将来的にRedisやファイルキャッシュを使用する場合はここで実装
        return true;
    }
}
