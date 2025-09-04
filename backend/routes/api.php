<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenstrualCycleController;
use App\Http\Controllers\UserDataController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\DailySymptomController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// 認証不要のルート
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// 認証が必要なルート
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateUser']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::delete('/user', [AuthController::class, 'deleteAccount']);
    
    // Menstrual Cycle routes
    Route::get('/menstrual-cycles', [MenstrualCycleController::class, 'index']);
    Route::post('/menstrual-cycles', [MenstrualCycleController::class, 'store']);
    Route::get('/menstrual-cycles/calendar', [MenstrualCycleController::class, 'getCalendarData']);
    Route::get('/menstrual-cycles/status', [MenstrualCycleController::class, 'getCurrentStatus']);
    Route::get('/menstrual-cycles/active-for-end-date', [MenstrualCycleController::class, 'getActiveCycleForEndDate']);
    Route::delete('/menstrual-cycles/delete-all', [MenstrualCycleController::class, 'deleteAll']);
    Route::get('/menstrual-cycles/{cycle}', [MenstrualCycleController::class, 'show']);
    Route::put('/menstrual-cycles/{cycle}', [MenstrualCycleController::class, 'update']);
    Route::delete('/menstrual-cycles/{cycle}', [MenstrualCycleController::class, 'destroy']);
    Route::post('/menstrual-cycles/end', [MenstrualCycleController::class, 'end']);
    
    // User Data routes
    Route::get('/user-data/settings', [UserDataController::class, 'getSettings']);
    Route::post('/user-data/settings', [UserDataController::class, 'saveSettings']);
    Route::get('/user-data/daily-symptoms', [UserDataController::class, 'getDailySymptoms']);
    Route::post('/user-data/daily-symptoms', [UserDataController::class, 'saveDailySymptoms']);
    Route::get('/user-data/pregnancy-records', [UserDataController::class, 'getPregnancyRecords']);
    Route::post('/user-data/pregnancy-records', [UserDataController::class, 'savePregnancyRecords']);
    Route::get('/user-data/medical-records', [UserDataController::class, 'getMedicalRecords']);
    Route::post('/user-data/medical-records', [UserDataController::class, 'saveMedicalRecords']);
    
    // Partner Connection routes
    Route::post('/partner/generate-invite', [PartnerController::class, 'generateInvite']);
    Route::post('/partner/join', [PartnerController::class, 'joinPartner']);
    Route::get('/partner/status', [PartnerController::class, 'getStatus']);
    Route::delete('/partner/disconnect', [PartnerController::class, 'disconnect']);
    Route::get('/partner/calendar', [PartnerController::class, 'getPartnerCalendar']);
    
    // Daily Symptoms routes
    Route::post('/daily-symptoms', [DailySymptomController::class, 'saveSymptoms']);
    Route::post('/daily-symptoms/bulk', [DailySymptomController::class, 'bulkSaveSymptoms']);
    Route::get('/daily-symptoms', [DailySymptomController::class, 'getSymptoms']);
    Route::get('/daily-symptoms/range', [DailySymptomController::class, 'getSymptomsRange']);
    Route::delete('/daily-symptoms/delete-all', [DailySymptomController::class, 'deleteAll']);
});