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

        return response()->json($cycle, 201);
    }

    public function end(Request $request): JsonResponse
    {
        $request->validate([
            'end_date' => 'required|date',
        ]);

        $user = $request->user();
        $endDate = Carbon::parse($request->end_date);

        // Find the latest active cycle that started before or on the given end date
        $cycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->where('start_date', '<=', $endDate)
            ->orderBy('start_date', 'desc')
            ->first();

        if (!$cycle) {
            return response()->json(['message' => 'No active cycle found to end on the specified date.'], 404);
        }

        $cycle->update(['end_date' => $endDate]);

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

        return response()->json($cycle);
    }

    public function destroy(Request $request, MenstrualCycle $cycle): JsonResponse
    {
        // Check if user owns this cycle
        if ($cycle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cycle->delete();

        return response()->json(['message' => 'Cycle deleted successfully']);
    }

    public function deleteAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Delete all menstrual cycles for the current user
        $deletedCount = $user->menstrualCycles()->delete();

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
            // アクティブな周期（終了日がない）の場合は開始日のみマーク
            if ($cycle->is_active) {
                // 開始日のみをマーク
                if ($cycle->start_date >= $startOfMonth && $cycle->start_date <= $endOfMonth) {
                    $calendarData[$cycle->start_date->format('Y-m-d')] = [
                        'hasPeriod' => false, // 期間としてはマークしない
                        'isPeriodStart' => true,
                        'isPeriodEnd' => false,
                        'isActive' => true,
                        'flowIntensity' => $cycle->flow_intensity,
                        'symptoms' => $cycle->symptoms,
                        'cycleId' => $cycle->id,
                        'notes' => $cycle->notes
                    ];
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

        // 予測データを追加
        $predictions = $this->calculatePredictions($user, $startOfMonth, $endOfMonth);
        $calendarData = array_merge($calendarData, $predictions);

        return response()->json([
            'year' => $year,
            'month' => $month,
            'data' => $calendarData
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

        $response = [
            'hasActiveCycle' => $activeCycle !== null,
            'activeCycle' => $activeCycle,
            'lastCycle' => $lastCycle,
            'daysSinceLastPeriod' => $lastCycle ? 
                Carbon::now()->diffInDays($lastCycle->end_date) : null
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
        
        // 過去6ヶ月の完了した周期を取得（より正確な平均のため）
        $completedCycles = $user->menstrualCycles()
            ->whereNotNull('end_date')
            ->where('start_date', '>=', now()->subMonths(6))
            ->orderBy('start_date', 'desc')
            ->limit(6)
            ->get();


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
     * デフォルトの28日周期での予測
     */
    private function calculateDefaultPredictions($user, $startOfMonth, $endOfMonth)
    {
        $predictions = [];
        
        // 最後の生理記録を取得
        $lastCycle = $user->menstrualCycles()
            ->orderBy('start_date', 'desc')
            ->first();

        if (!$lastCycle) {
            // データがない場合は予測なし（初回利用時は予測しない）
            return $predictions;
        }

        // 最初の生理周期から28日周期で予測
        $nextPredictedStart = $lastCycle->start_date->copy()->addDays(28);
        
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
}
