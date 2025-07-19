<?php

namespace App\Http\Controllers;

use App\Models\MenstrualCycle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

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

        // デバッグログ
        \Log::info('New cycle created', [
            'cycle_id' => $cycle->id,
            'start_date' => $cycle->start_date,
            'is_active' => $cycle->is_active,
            'user_id' => $user->id
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

        // デバッグログ
        \Log::info('Calendar data response', [
            'year' => $year,
            'month' => $month,
            'cycles_count' => $cycles->count(),
            'calendar_data' => $calendarData
        ]);

        return response()->json([
            'year' => $year,
            'month' => $month,
            'data' => $calendarData
        ]);
    }

    public function getCurrentStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // デバッグ用：ユーザーの全周期を取得
        $allCycles = $user->menstrualCycles()->orderBy('start_date', 'desc')->get();
        \Log::info('All user cycles', [
            'user_id' => $user->id,
            'total_cycles' => $allCycles->count(),
            'cycles' => $allCycles->map(function($cycle) {
                return [
                    'id' => $cycle->id,
                    'start_date' => $cycle->start_date,
                    'end_date' => $cycle->end_date,
                    'is_active' => $cycle->is_active
                ];
            })
        ]);
        
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

        // デバッグログ
        \Log::info('Current status response', [
            'user_id' => $user->id,
            'hasActiveCycle' => $response['hasActiveCycle'],
            'activeCycle_id' => $activeCycle?->id,
            'activeCycle_start_date' => $activeCycle?->start_date
        ]);

        return response()->json($response);
    }

    public function getActiveCycleForEndDate(Request $request): JsonResponse
    {
        $request->validate([
            'end_date' => 'required|date'
        ]);

        $user = $request->user();
        $endDate = Carbon::parse($request->end_date);
        
        // デバッグ用：全てのアクティブ周期を取得
        $allActiveCycles = $user->menstrualCycles()
            ->whereNull('end_date')
            ->get();
        
        // 指定された終了日以前に開始され、まだ終了していない周期を取得
        $activeCycle = $user->menstrualCycles()
            ->whereNull('end_date')
            ->where('start_date', '<=', $endDate)
            ->orderBy('start_date', 'desc')
            ->first();

        // デバッグログ
        \Log::info('Active cycle search for end date', [
            'user_id' => $user->id,
            'end_date' => $endDate->format('Y-m-d'),
            'all_active_cycles' => $allActiveCycles->map(function($cycle) {
                return [
                    'id' => $cycle->id,
                    'start_date' => $cycle->start_date->format('Y-m-d'),
                    'end_date' => $cycle->end_date
                ];
            }),
            'found_cycle' => $activeCycle ? [
                'id' => $activeCycle->id,
                'start_date' => $activeCycle->start_date->format('Y-m-d')
            ] : null
        ]);

        return response()->json([
            'hasActiveCycle' => $activeCycle !== null,
            'activeCycle' => $activeCycle
        ]);
    }
}
