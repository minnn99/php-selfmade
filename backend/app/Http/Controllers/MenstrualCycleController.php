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

        return response()->json($cycle, 201);
    }

    public function end(Request $request, MenstrualCycle $cycle): JsonResponse
    {
        // Check if user owns this cycle
        if ($cycle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if cycle is already ended
        if ($cycle->end_date) {
            return response()->json([
                'message' => 'This cycle has already ended.'
            ], 400);
        }

        $request->validate([
            'end_date' => 'required|date|after_or_equal:' . $cycle->start_date
        ]);

        $cycle->update([
            'end_date' => $request->end_date
        ]);

        return response()->json($cycle);
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
            $start = max($cycle->start_date, $startOfMonth);
            $end = $cycle->end_date ? min($cycle->end_date, $endOfMonth) : $endOfMonth;

            for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                $calendarData[$date->format('Y-m-d')] = [
                    'hasPeriod' => true,
                    'isActive' => $cycle->is_active,
                    'flowIntensity' => $cycle->flow_intensity,
                    'symptoms' => $cycle->symptoms
                ];
            }
        }

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

        return response()->json([
            'hasActiveCycle' => $activeCycle !== null,
            'activeCycle' => $activeCycle,
            'lastCycle' => $lastCycle,
            'daysSinceLastPeriod' => $lastCycle ? 
                Carbon::now()->diffInDays($lastCycle->end_date) : null
        ]);
    }
}
