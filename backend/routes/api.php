<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenstrualCycleController;
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
});