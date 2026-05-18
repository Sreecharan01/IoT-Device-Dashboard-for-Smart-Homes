<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ScanController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

// ── Public Auth Routes ──────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// ── Authenticated Routes ────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout',     [AuthController::class, 'logout']);
    Route::get('/auth/profile',     [AuthController::class, 'profile']);
    Route::put('/auth/profile',     [AuthController::class, 'updateProfile']);

    // Devices (CRUD)
    Route::get('/devices',          [DeviceController::class, 'index']);
    Route::post('/devices',         [DeviceController::class, 'store']);
    Route::put('/devices/{id}',     [DeviceController::class, 'update']);
    Route::delete('/devices/{id}',  [DeviceController::class, 'destroy']);

    // Geofence — Real-time Phone GPS Tracking
    Route::get('/home-location',    [LocationController::class, 'getHome']);
    Route::post('/home-location',   [LocationController::class, 'setHome']);
    Route::post('/location',        [LocationController::class, 'update']);

    // Device Discovery / Network Scan
    Route::get('/scan/devices',     [ScanController::class, 'scan']);

    // Alerts
    Route::get('/alerts',           [AlertController::class, 'index']);
    Route::post('/alerts',          [AlertController::class, 'store'])->middleware(AdminMiddleware::class);

    // Admin Routes
    Route::middleware(AdminMiddleware::class)->prefix('admin')->group(function () {
        Route::get('/users',                               [AdminController::class, 'users']);
        Route::get('/devices',                             [AdminController::class, 'devices']);
        Route::put('/users/{id}/subscription',             [AdminController::class, 'updateSubscription']);
    });
});
