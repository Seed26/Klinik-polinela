<?php

namespace App\Http\Controllers;

use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\Medicine;
use App\Models\MedicineTransaction;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\PatientProfile;
use App\Models\Queue;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Statistik realtime dashboard admin
     */
    public function dashboardStats(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $selectedDate = $request->query('date', $today);

        // Antrean tanggal terpilih
        $dayQueues = Queue::where('visit_date', $selectedDate)->get();

        $stats = [
            'total_patients' => PatientProfile::count(),
            'today_patients' => $dayQueues->pluck('patient_profile_id')->unique()->count(),
            'today_queues' => $dayQueues->count(),
            'waiting_queues' => $dayQueues->where('status', 'Menunggu')->count(),
            'processing_queues' => $dayQueues->where('status', 'Diperiksa')->count(),
            'completed_queues' => $dayQueues->where('status', 'Selesai')->count(),
            'total_medicines' => Medicine::count(),
            'low_stock_medicines' => Medicine::whereColumn('stock', '<=', 'min_stock_alert')->count(),
            'active_doctors' => DoctorProfile::whereHas('user', function ($q) {
                $q->where('is_active', true);
            })->count(),
            'active_schedules' => DoctorSchedule::where('is_active', true)->count(),
        ];

        $latestQueues = Queue::with(['patientProfile.user', 'doctorProfile.user'])
            ->where('visit_date', $selectedDate)
            ->latest()
            ->take(6)
            ->get();

        $medicines = Medicine::orderBy('stock', 'asc')->take(5)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'latest_queues' => $latestQueues,
                'medicines' => $medicines,
            ],
        ]);
    }

    /**
     * Manajemen Antrean: List & Filter
     */
    public function getQueues(Request $request)
    {
        $query = Queue::with(['patientProfile.user', 'doctorProfile.user']);

        if ($request->has('date') && $request->date) {
            $query->where('visit_date', $request->date);
        }

        if ($request->has('status') && $request->status && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('queue_number', 'like', "%{$s}%")
                    ->orWhereHas('patientProfile.user', function ($u) use ($s) {
                        $u->where('name', 'like', "%{$s}%");
                    })
                    ->orWhereHas('patientProfile', function ($p) use ($s) {
                        $p->where('identifier_number', 'like', "%{$s}%");
                    });
            });
        }

        $queues = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $queues,
        ]);
    }

    /**
     * Daftarkan antrean secara manual oleh admin.
     */
    public function storeQueue(Request $request)
    {
        $validated = $request->validate([
            'patient_profile_id' => ['required', 'integer', 'exists:profil_pasien,id'],
            'doctor_profile_id' => ['required', 'integer', 'exists:profil_dokter,id'],
            'visit_date' => ['required', 'date', 'after_or_equal:today'],
            'complaint' => ['nullable', 'string', 'max:2000'],
        ]);

        $queue = DB::transaction(function () use ($validated) {
            $alreadyRegistered = Queue::where('patient_profile_id', $validated['patient_profile_id'])
                ->whereDate('visit_date', $validated['visit_date'])
                ->whereNot('status', 'Dibatalkan')
                ->exists();

            if ($alreadyRegistered) {
                return null;
            }

            $lastQueue = Queue::whereDate('visit_date', $validated['visit_date'])
                ->lockForUpdate()
                ->count();

            return Queue::create([
                ...$validated,
                'queue_number' => 'A-'.str_pad((string) ($lastQueue + 1), 3, '0', STR_PAD_LEFT),
                'estimated_time' => Carbon::now()->format('H:i:s'),
                'status' => 'Menunggu',
            ]);
        });

        if ($queue === null) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien sudah memiliki antrean pada tanggal tersebut.',
            ], 422);
        }

        $queue->load(['patientProfile.user', 'doctorProfile.user']);

        return response()->json([
            'success' => true,
            'message' => 'Antrean berhasil didaftarkan.',
            'data' => $queue,
        ], 201);
    }

    /**
     * Ubah status antrean
     */
    public function updateQueueStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Menunggu,Diperiksa,Selesai,Dibatalkan',
        ]);

        $queue = Queue::findOrFail($id);
        $queue->status = $request->status;
        $queue->save();

        return response()->json([
            'success' => true,
            'message' => 'Status antrean berhasil diperbarui.',
            'data' => $queue,
        ]);
    }

    /**
     * Panggil antrean oleh Admin
     */
    public function callQueue($id)
    {
        $queue = Queue::with(['patientProfile.user', 'doctorProfile.user'])->findOrFail($id);

        if ($queue->status === 'Menunggu') {
            $queue->status = 'Diperiksa';
            $queue->save();
        }

        $patientName = $queue->patientProfile?->user?->name ?? 'Pasien';

        return response()->json([
            'success' => true,
            'message' => "Nomor antrean {$queue->queue_number} ({$patientName}) berhasil dipanggil.",
            'data' => $queue,
        ]);
    }

    /**
     * Master Pasien: List untuk form pendaftaran antrean
     */
    public function getPatients(Request $request)
    {
        $query = PatientProfile::with('user');

        if ($request->has('search') && $request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('identifier_number', 'like', "%{$s}%")
                    ->orWhereHas('user', function ($u) use ($s) {
                        $u->where('name', 'like', "%{$s}%")
                            ->orWhere('email', 'like', "%{$s}%");
                    });
            });
        }

        $patients = $query->take(50)->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    /**
     * Hapus antrean
     */
    public function deleteQueue($id)
    {
        $queue = Queue::findOrFail($id);
        $queue->delete();

        return response()->json([
            'success' => true,
            'message' => 'Antrean berhasil dihapus.',
        ]);
    }

    /**
     * Master Obat: List
     */
    public function getMedicines(Request $request)
    {
        $query = Medicine::query();

        if ($request->has('search') && $request->search) {
            $s = $request->search;
            $query->where('name', 'like', "%{$s}%")
                ->orWhere('category', 'like', "%{$s}%");
        }

        $medicines = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $medicines,
        ]);
    }

    /**
     * Tambah Obat
     */
    public function storeMedicine(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'required|string|max:100',
            'form' => 'required|string|max:50',
            'stock' => 'required|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'dosage' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        $medicine = Medicine::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Obat berhasil ditambahkan.',
            'data' => $medicine,
        ], 201);
    }

    /**
     * Update Obat
     */
    public function updateMedicine(Request $request, $id)
    {
        $medicine = Medicine::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'required|string|max:100',
            'form' => 'required|string|max:50',
            'stock' => 'required|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'dosage' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        $medicine->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data obat berhasil diperbarui.',
            'data' => $medicine,
        ]);
    }

    /**
     * Hapus Obat
     */
    public function deleteMedicine($id)
    {
        $medicine = Medicine::findOrFail($id);
        $medicine->delete();

        return response()->json([
            'success' => true,
            'message' => 'Obat berhasil dihapus.',
        ]);
    }

    /**
     * Return stock movement history for the admin inventory page.
     */
    public function getMedicineTransactions(): JsonResponse
    {
        $transactions = MedicineTransaction::with('medicine')
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Record an incoming or outgoing medicine stock movement.
     */
    public function storeMedicineTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'medicine_id' => ['required', 'integer', 'exists:obat,id'],
            'type' => ['required', 'in:masuk,keluar'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $transaction = DB::transaction(function () use ($validated) {
            $medicine = Medicine::query()->lockForUpdate()->findOrFail($validated['medicine_id']);
            $stockBefore = $medicine->stock;
            $quantity = $validated['quantity'];

            if ($validated['type'] === 'keluar' && $stockBefore < $quantity) {
                return null;
            }

            $medicine->stock = $validated['type'] === 'masuk'
                ? $stockBefore + $quantity
                : $stockBefore - $quantity;
            $medicine->save();

            return MedicineTransaction::create([
                'medicine_id' => $medicine->id,
                'type' => $validated['type'],
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $medicine->stock,
                'reference_type' => 'admin',
                'reference_id' => (string) auth()->id(),
                'notes' => $validated['notes'] ?? null,
            ])->load('medicine');
        });

        if ($transaction === null) {
            return response()->json([
                'success' => false,
                'message' => 'Stok tidak mencukupi untuk pengeluaran tersebut.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaksi stok berhasil dicatat.',
            'data' => $transaction,
        ], 201);
    }

    /**
     * Manajemen Dokter: List
     */
    public function getDoctors()
    {
        $doctors = DoctorProfile::with(['user', 'schedules'])->get();

        return response()->json([
            'success' => true,
            'data' => $doctors,
        ]);
    }

    /**
     * Tambah Dokter Baru
     */
    public function storeDoctor(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'sip_number' => 'required|string|unique:profil_dokter,sip_number',
            'specialization' => 'required|string|max:100',
            'clinic_type' => 'required|string|max:100',
            'phone' => 'nullable|string|max:50',
            'bio' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'password' => \Hash::make($request->password),
            'role' => 'doctor',
            'phone' => $request->phone ?? '',
            'is_active' => true,
        ]);

        $doctorProfile = DoctorProfile::create([
            'user_id' => $user->id,
            'sip_number' => $request->sip_number,
            'specialization' => $request->specialization,
            'clinic_type' => $request->clinic_type,
            'bio' => $request->bio,
        ]);

        $doctorProfile->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Dokter berhasil ditambahkan.',
            'data' => $doctorProfile,
        ], 201);
    }

    /**
     * Return privacy-safe queue information for the public clinic landing page.
     */
    public function getPublicQueues(): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $queues = Queue::query()
            ->whereDate('visit_date', $today)
            ->whereIn('status', ['Menunggu', 'Diperiksa', 'Selesai'])
            ->orderBy('created_at')
            ->get(['id', 'queue_number', 'doctor_profile_id', 'visit_date', 'estimated_time', 'status', 'created_at']);

        $serviceTypes = DoctorProfile::query()
            ->whereIn('id', $queues->pluck('doctor_profile_id')->filter()->unique())
            ->pluck('clinic_type', 'id');

        $activeQueue = $queues->firstWhere('status', 'Diperiksa');
        $publicQueues = $queues->map(fn (Queue $queue): array => [
            'queue_number' => $queue->queue_number,
            'service_type' => $serviceTypes->get($queue->doctor_profile_id, 'Pelayanan klinik'),
            'status' => $queue->status,
            'visit_date' => $queue->visit_date,
            'queue_time' => $queue->estimated_time,
            'created_at' => $queue->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today,
                'currently_served' => $activeQueue?->queue_number,
                'waiting_count' => $queues->where('status', 'Menunggu')->count(),
                'queues' => $publicQueues,
            ],
        ]);
    }

    /**
     * Return active doctor schedules for the public clinic landing page.
     */
    public function getPublicSchedules()
    {
        $schedules = DoctorSchedule::query()
            ->with(['doctorProfile.user:id,name'])
            ->where('is_active', true)
            ->orderBy('day')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Manajemen Jadwal Dokter: List
     */
    public function getSchedules()
    {
        $schedules = DoctorSchedule::with('doctorProfile.user')
            ->orderBy('is_active', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Tambah Jadwal Dokter
     */
    public function storeSchedule(Request $request)
    {
        $validated = $request->validate([
            'doctor_profile_id' => 'required|exists:profil_dokter,id',
            'day' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_active' => 'boolean',
        ]);

        $schedule = DoctorSchedule::create($validated);
        $schedule->load('doctorProfile.user');

        return response()->json([
            'success' => true,
            'message' => 'Jadwal dokter berhasil ditambahkan.',
            'data' => $schedule,
        ], 201);
    }

    /**
     * Update Jadwal Dokter
     */
    public function updateSchedule(Request $request, $id)
    {
        $schedule = DoctorSchedule::findOrFail($id);

        $validated = $request->validate([
            'day' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_active' => 'boolean',
        ]);

        $schedule->update($validated);
        $schedule->load('doctorProfile.user');

        return response()->json([
            'success' => true,
            'message' => 'Jadwal dokter berhasil diperbarui.',
            'data' => $schedule,
        ]);
    }

    /**
     * Hapus Jadwal Dokter
     */
    public function deleteSchedule($id)
    {
        $schedule = DoctorSchedule::findOrFail($id);
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus.',
        ]);
    }

    /**
     * Broadcast Notifikasi
     */
    public function getNotifications()
    {
        $notifications = Notification::with('creator')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function storeNotification(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'target_role' => 'required|in:all,patient,doctor',
        ]);

        $notif = Notification::create([
            'created_by_user_id' => $request->user()->id,
            'title' => $request->title,
            'message' => $request->message,
            'target_role' => $request->target_role,
        ]);

        // Kirim ke penerima
        $query = User::where('is_active', true);
        if ($request->target_role !== 'all') {
            $query->where('role', $request->target_role);
        }
        $users = $query->get();

        foreach ($users as $u) {
            NotificationRecipient::create([
                'notification_id' => $notif->id,
                'user_id' => $u->id,
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi siaran berhasil dikirim.',
            'data' => $notif,
        ], 201);
    }
}
