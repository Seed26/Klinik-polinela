<?php

namespace App\Http\Controllers;

use App\Models\DoctorSchedule;
use App\Models\MedicalRecord;
use App\Models\NotificationRecipient;
use App\Models\Queue;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /**
     * Dashboard Pasien
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $patientProfile = $user->patientProfile;

        if (! $patientProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil pasien tidak ditemukan.',
            ], 404);
        }

        $today = Carbon::today()->toDateString();

        // Antrean aktif hari ini (jika ada)
        $activeQueue = Queue::with('doctorProfile.user')
            ->where('patient_profile_id', $patientProfile->id)
            ->where('visit_date', $today)
            ->whereIn('status', ['Menunggu', 'Diperiksa'])
            ->first();

        // Riwayat antrean terakhir
        $latestQueues = Queue::with('doctorProfile.user')
            ->where('patient_profile_id', $patientProfile->id)
            ->latest()
            ->take(5)
            ->get();

        // Antrean live klinik saat ini
        $todayQueues = Queue::where('visit_date', $today)->whereIn('status', ['Menunggu', 'Diperiksa'])->get();
        $nextQueue = $todayQueues->where('status', 'Menunggu')->sortBy('id')->first();
        $liveQueue = [
            'waiting_count' => $todayQueues->where('status', 'Menunggu')->count(),
            'processing_count' => $todayQueues->where('status', 'Diperiksa')->count(),
            'next_number' => $nextQueue ? $nextQueue->queue_number : null,
        ];

        // Jadwal dokter aktif hari ini / mendatang
        $schedules = DoctorSchedule::with('doctorProfile.user')
            ->where('is_active', true)
            ->take(6)
            ->get();

        // Notifikasi belum dibaca
        $unreadNotifCount = NotificationRecipient::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => $patientProfile->load('user'),
                'active_queue' => $activeQueue,
                'latest_queues' => $latestQueues,
                'live_queue' => $liveQueue,
                'schedules' => $schedules,
                'unread_notifications_count' => $unreadNotifCount,
            ],
        ]);
    }

    /**
     * Pengajuan Pendaftaran Antrean Online (Maks 1 per tanggal)
     */
    public function storeQueue(Request $request)
    {
        $request->validate([
            'doctor_profile_id' => 'required|exists:profil_dokter,id',
            'visit_date' => 'required|date|after_or_equal:today',
            'complaint' => 'nullable|string',
        ]);

        $user = $request->user();
        $patientProfile = $user->patientProfile;

        // Aturan: Maksimal 1 antrean per tanggal
        $existing = Queue::where('patient_profile_id', $patientProfile->id)
            ->where('visit_date', $request->visit_date)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah memiliki antrean aktif pada tanggal '.$request->visit_date.' (Nomor: '.$existing->queue_number.').',
            ], 422);
        }

        // Hitung nomor urut harian otomatis
        $dailyCount = Queue::where('visit_date', $request->visit_date)->count();
        $queueNumber = 'A-'.str_pad($dailyCount + 1, 3, '0', STR_PAD_LEFT);

        $queue = Queue::create([
            'queue_number' => $queueNumber,
            'patient_profile_id' => $patientProfile->id,
            'doctor_profile_id' => $request->doctor_profile_id,
            'visit_date' => $request->visit_date,
            'estimated_time' => Carbon::now()->format('H:i'),
            'status' => 'Menunggu',
            'complaint' => $request->complaint,
        ]);

        $queue->load(['doctorProfile.user', 'patientProfile.user']);

        return response()->json([
            'success' => true,
            'message' => 'Antrean berhasil didaftarkan! Nomor antrean Anda: '.$queueNumber,
            'data' => $queue,
        ], 201);
    }

    /**
     * Batalkan Antrean (Hanya jika status 'Menunggu')
     */
    public function cancelQueue(Request $request, $id)
    {
        $user = $request->user();
        $patientProfile = $user->patientProfile;

        $queue = Queue::where('patient_profile_id', $patientProfile->id)->findOrFail($id);

        if ($queue->status !== 'Menunggu') {
            return response()->json([
                'success' => false,
                'message' => 'Antrean yang sedang diperiksa atau sudah selesai tidak dapat dibatalkan.',
            ], 422);
        }

        $queue->status = 'Dibatalkan';
        $queue->save();

        return response()->json([
            'success' => true,
            'message' => 'Antrean berhasil dibatalkan.',
        ]);
    }

    /**
     * Riwayat Rekam Medis & Resep Pribadi Pasien
     */
    public function getMedicalRecords(Request $request)
    {
        $user = $request->user();
        $patientProfile = $user->patientProfile;

        $records = MedicalRecord::with(['doctorProfile.user', 'prescription.items.medicine'])
            ->where('patient_profile_id', $patientProfile->id)
            ->orderBy('record_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Jadwal Praktik Dokter untuk Pasien
     */
    public function getSchedules()
    {
        $schedules = DoctorSchedule::with('doctorProfile.user')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Notifikasi / Pengumuman untuk Pasien
     */
    public function getNotifications(Request $request)
    {
        $user = $request->user();

        $notifications = NotificationRecipient::with('notification')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Tandai Notifikasi Sudah Dibaca
     */
    public function markNotificationAsRead(Request $request, $id)
    {
        $user = $request->user();

        $recipient = NotificationRecipient::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $recipient->is_read = true;
        $recipient->read_at = Carbon::now();
        $recipient->save();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }
}
