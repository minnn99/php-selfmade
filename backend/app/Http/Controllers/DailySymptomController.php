<?php

namespace App\Http\Controllers;

use App\Models\DailySymptom;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DailySymptomController extends Controller
{
    /**
     * 日次症状データを保存または更新
     */
    public function saveSymptoms(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $request->validate([
            'date' => 'required|date',
            'symptoms' => 'array',
            'mood' => 'nullable|string',
            'healthNotes' => 'nullable|string',
            'flowIntensity' => 'nullable|integer|min:1|max:5'
        ]);
        
        try {
            $date = $request->input('date');
            $symptomsData = [
                'symptoms' => $request->input('symptoms', []),
                'mood' => $request->input('mood', ''),
                'healthNotes' => $request->input('healthNotes', ''),
                'flowIntensity' => $request->input('flowIntensity')
            ];
            
            // 既存のレコードを更新するか、新規作成
            $dailySymptom = DailySymptom::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'symptom_date' => $date
                ],
                [
                    'symptoms_data' => $symptomsData
                ]
            );
            
            return response()->json([
                'success' => true,
                'data' => $dailySymptom,
                'message' => '症状データが保存されました。'
            ]);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => '症状データの保存に失敗しました。'
            ], 500);
        }
    }

    /**
     * 複数日の症状データを一括保存（データ移行用）
     */
    public function bulkSaveSymptoms(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $request->validate([
            'symptoms_data' => 'required|array',
            'symptoms_data.*.date' => 'required|date',
            'symptoms_data.*.symptoms' => 'array',
            'symptoms_data.*.mood' => 'nullable|string',
            'symptoms_data.*.healthNotes' => 'nullable|string',
            'symptoms_data.*.flowIntensity' => 'nullable|integer|min:1|max:5'
        ]);
        
        try {
            $symptomsDataArray = $request->input('symptoms_data');
            $savedCount = 0;
            $errors = [];
            
            foreach ($symptomsDataArray as $item) {
                try {
                    $date = $item['date'];
                    $symptomsData = [
                        'symptoms' => $item['symptoms'] ?? [],
                        'mood' => $item['mood'] ?? '',
                        'healthNotes' => $item['healthNotes'] ?? '',
                        'flowIntensity' => $item['flowIntensity'] ?? null
                    ];
                    
                    // 既存のレコードを更新するか、新規作成
                    DailySymptom::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'symptom_date' => $date
                        ],
                        [
                            'symptoms_data' => $symptomsData
                        ]
                    );
                    
                    $savedCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'date' => $item['date'],
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'saved_count' => $savedCount,
                    'total_count' => count($symptomsDataArray),
                    'errors' => $errors
                ],
                'message' => "{$savedCount}件の症状データが保存されました。"
            ]);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => '症状データの一括保存に失敗しました。'
            ], 500);
        }
    }

    /**
     * 指定日の症状データを取得
     */
    public function getSymptoms(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $request->validate([
            'date' => 'required|date'
        ]);
        
        try {
            $date = $request->input('date');
            
            $dailySymptom = DailySymptom::where('user_id', $user->id)
                ->where('symptom_date', $date)
                ->first();
                
            if ($dailySymptom) {
                return response()->json([
                    'success' => true,
                    'data' => $dailySymptom->symptoms_data
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'symptoms' => [],
                        'mood' => '',
                        'healthNotes' => '',
                        'flowIntensity' => null
                    ]
                ]);
            }
            
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => '症状データの取得に失敗しました。'
            ], 500);
        }
    }

    /**
     * 期間指定で症状データを取得（統計用）
     */
    public function getSymptomsRange(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);
        
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $dailySymptoms = DailySymptom::where('user_id', $user->id)
                ->whereBetween('symptom_date', [$startDate, $endDate])
                ->orderBy('symptom_date', 'asc')
                ->get();
                
            // 日付をキーとした連想配列に変換
            $symptomsData = [];
            foreach ($dailySymptoms as $symptom) {
                $dateKey = (string) $symptom->symptom_date;
                $symptomsData[$dateKey] = $symptom->symptoms_data;
            }
            
            return response()->json([
                'success' => true,
                'data' => $symptomsData,
                'meta' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'total_days' => count($symptomsData)
                ]
            ]);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => '症状データの取得に失敗しました。'
            ], 500);
        }
    }

    /**
     * ユーザーの全症状データを削除
     */
    public function deleteAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        try {
            $deletedCount = DailySymptom::where('user_id', $user->id)->delete();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'deleted_count' => $deletedCount
                ],
                'message' => '全ての症状データが削除されました。'
            ]);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => '症状データの削除に失敗しました。'
            ], 500);
        }
    }
}