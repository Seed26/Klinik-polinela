<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\PatientController;
use Illuminate\Support\Facades\Route;

// Public clinic information
Route::get('/public/schedules', [AdminController::class, 'getPublicSchedules']);
Route::get('/public/queues', [AdminController::class, 'getPublicQueues']);

// Public Auth Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    // Admin API Routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard/stats', [AdminController::class, 'dashboardStats']);
        Route::get('/queues', [AdminController::class, 'getQueues']);
        Route::post('/queues', [AdminController::class, 'storeQueue']);
        Route::patch('/queues/{id}/status', [AdminController::class, 'updateQueueStatus']);
        Route::post('/queues/{id}/call', [AdminController::class, 'callQueue']);
        Route::delete('/queues/{id}', [AdminController::class, 'deleteQueue']);
        Route::get('/patients', [AdminController::class, 'getPatients']);
        Route::get('/doctors', [AdminController::class, 'getDoctors']);
        Route::post('/doctors', [AdminController::class, 'storeDoctor']);
        Route::get('/schedules', [AdminController::class, 'getSchedules']);
        Route::post('/schedules', [AdminController::class, 'storeSchedule']);
        Route::put('/schedules/{id}', [AdminController::class, 'updateSchedule']);
        Route::delete('/schedules/{id}', [AdminController::class, 'deleteSchedule']);
        Route::get('/medicines', [AdminController::class, 'getMedicines']);
        Route::post('/medicines', [AdminController::class, 'storeMedicine']);
        Route::put('/medicines/{id}', [AdminController::class, 'updateMedicine']);
        Route::delete('/medicines/{id}', [AdminController::class, 'deleteMedicine']);
        Route::get('/medicine-transactions', [AdminController::class, 'getMedicineTransactions']);
        Route::post('/medicine-transactions', [AdminController::class, 'storeMedicineTransaction']);
        Route::get('/notifications', [AdminController::class, 'getNotifications']);
        Route::post('/notifications', [AdminController::class, 'storeNotification']);
    });

    // Doctor API Routes
    Route::prefix('doctor')->middleware('role:doctor')->group(function () {
        Route::get('/dashboard', [DoctorController::class, 'dashboard']);
        Route::post('/queues/{queueId}/call', [DoctorController::class, 'callPatient']);
        Route::post('/examinations', [DoctorController::class, 'storeExamination']);
        Route::get('/patient-history/{patientId}', [DoctorController::class, 'getPatientHistory']);
        Route::get('/medicines/available', [DoctorController::class, 'getAvailableMedicines']);
    });

    // Patient API Routes
    Route::prefix('patient')->middleware('role:patient')->group(function () {
        Route::get('/dashboard', [PatientController::class, 'dashboard']);
        Route::get('/schedules', [PatientController::class, 'getSchedules']);
        Route::post('/queues', [PatientController::class, 'storeQueue']);
        Route::delete('/queues/{id}', [PatientController::class, 'cancelQueue']);
        Route::get('/medical-records', [PatientController::class, 'getMedicalRecords']);
        Route::get('/notifications', [PatientController::class, 'getNotifications']);
        Route::patch('/notifications/{id}/read', [PatientController::class, 'markNotificationAsRead']);
    });
});
