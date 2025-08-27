<?php

namespace App\Http\Controllers;

use App\Models\UserSetting;
use App\Models\DailySymptom;
use App\Models\PregnancyRecord;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserDataController extends Controller
{
    /**
     * ユーザー設定を取得
     */
    public function getSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $settings = UserSetting::where('user_id', $user->id)->get();
        
        $settingsData = [];
        foreach ($settings as $setting) {
            $settingsData[$setting->setting_key] = $setting->setting_value;
        }
        
        return response()->json([
            'success' => true,
            'data' => $settingsData
        ]);
    }

    /**
     * ユーザー設定を保存
     */
    public function saveSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $settingsData = $request->input('settings', []);
        
        foreach ($settingsData as $key => $value) {
            UserSetting::updateOrCreate(
                ['user_id' => $user->id, 'setting_key' => $key],
                ['setting_value' => $value]
            );
        }
        
        return response()->json([
            'success' => true,
            'message' => '設定が保存されました'
        ]);
    }

    /**
     * 日別症状データを取得
     */
    public function getDailySymptoms(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->input('date');
        
        if ($date) {
            $symptom = DailySymptom::where('user_id', $user->id)
                ->where('symptom_date', $date)
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => $symptom ? $symptom->symptoms_data : []
            ]);
        }
        
        // 全ての症状データを取得
        $symptoms = DailySymptom::where('user_id', $user->id)
            ->orderBy('symptom_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $symptoms
        ]);
    }

    /**
     * 日別症状データを保存
     */
    public function saveDailySymptoms(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->input('date');
        $symptomsData = $request->input('symptoms_data', []);
        
        $request->validate([
            'date' => 'required|date',
            'symptoms_data' => 'required|array'
        ]);
        
        DailySymptom::updateOrCreate(
            ['user_id' => $user->id, 'symptom_date' => $date],
            ['symptoms_data' => $symptomsData]
        );
        
        return response()->json([
            'success' => true,
            'message' => '症状データが保存されました'
        ]);
    }

    /**
     * 妊娠記録を取得
     */
    public function getPregnancyRecords(Request $request): JsonResponse
    {
        $user = $request->user();
        $record = PregnancyRecord::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();
        
        return response()->json([
            'success' => true,
            'data' => $record ? [
                'start_date' => $record->start_date,
                'records_data' => $record->records_data,
                'is_active' => $record->is_active
            ] : null
        ]);
    }

    /**
     * 妊娠記録を保存
     */
    public function savePregnancyRecords(Request $request): JsonResponse
    {
        $user = $request->user();
        $startDate = $request->input('start_date');
        $recordsData = $request->input('records_data', []);
        $isActive = $request->input('is_active', true);
        
        PregnancyRecord::updateOrCreate(
            ['user_id' => $user->id, 'is_active' => true],
            [
                'start_date' => $startDate,
                'records_data' => $recordsData,
                'is_active' => $isActive
            ]
        );
        
        return response()->json([
            'success' => true,
            'message' => '妊娠記録が保存されました'
        ]);
    }

    /**
     * 医療記録を取得
     */
    public function getMedicalRecords(Request $request): JsonResponse
    {
        $user = $request->user();
        $response = UserSetting::where('user_id', $user->id)
            ->whereIn('setting_key', ['hospitalVisits', 'testResults', 'medications'])
            ->get();
        
        $medicalData = [];
        foreach ($response as $setting) {
            $medicalData[$setting->setting_key] = $setting->setting_value;
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'hospitalVisits' => $medicalData['hospitalVisits'] ?? [],
                'testResults' => $medicalData['testResults'] ?? [],
                'medications' => $medicalData['medications'] ?? []
            ]
        ]);
    }

    /**
     * 医療記録を保存
     */
    public function saveMedicalRecords(Request $request): JsonResponse
    {
        $user = $request->user();
        $recordType = $request->input('type'); // 'hospitalVisits', 'testResults', 'medications'
        $recordData = $request->input('data', []);
        
        $request->validate([
            'type' => 'required|in:hospitalVisits,testResults,medications',
            'data' => 'array'
        ]);
        
        UserSetting::updateOrCreate(
            ['user_id' => $user->id, 'setting_key' => $recordType],
            ['setting_value' => $recordData]
        );
        
        return response()->json([
            'success' => true,
            'message' => '医療記録が保存されました'
        ]);
    }
}
