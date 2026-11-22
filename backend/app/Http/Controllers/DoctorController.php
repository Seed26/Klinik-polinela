<?php

namespace App\Http\Controllers;

use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\MedicineTransaction;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Queue;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DoctorController extends Controller
{
    /**
     * Dashboard Dokter: Antrean hari ini untuk dokter terkait
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $doctorProfile = $user->doctorProfile;

        if (! $doctorProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dokter tidak ditemukan.',
            ], 404);
        }

        $today = Carbon::today()->toDateString();

        $queues = Queue::with('patientProfile.user')
            ->where('doctor_profile_id', $doctorProfile->id)
            ->where('visit_date', $today)
            ->orderBy('created_at', 'asc')
            ->get();

        $stats = [
            'today_total' => $queues->count(),
            'waiting' => $queues->where('status', 'Menunggu')->count(),
            'processing' => $queues->where('status', 'Diperiksa')->count(),
            'completed' => $queues->where('status', 'Selesai')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'doctor' => $doctorProfile->load('user'),
                'stats' => $stats,
                'queues' => $queues,
            ],
        ]);
    }

    /**
     * Pemanggilan Pasien (Panggil / Ubah status antrean ke 'Diperiksa')
     */
    public function callPatient(Request $request, $queueId)
    {
        $doctorProfile = $request->user()->doctorProfile;

        if (! $doctorProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dokter tidak ditemukan.',
            ], 404);
        }

        $queue = Queue::with('patientProfile.user')
            ->where('doctor_profile_id', $doctorProfile->id)
            ->findOrFail($queueId);

        if ($queue->status !== 'Menunggu') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya antrean menunggu yang dapat dipanggil.',
            ], 422);
        }

        // Update status antrean menjadi 'Diperiksa'
        $queue->status = 'Diperiksa';
        $queue->save();

        return response()->json([
            'success' => true,
            'message' => 'Pasien nomor '.$queue->queue_number.' dipanggil untuk pemeriksaan.',
            'data' => $queue,
        ]);
    }

    /**
     * Form Simpan Rekam Medis & Resep Obat (Transaksi Atomic)
     */
    public function storeExamination(Request $request)
    {
        $validated = $request->validate([
            'queue_id' => 'required|integer|exists:antrean,id',
            'complaint' => 'required|string',
            'blood_pressure' => 'nullable|string',
            'body_temperature' => 'nullable|string',
            'body_weight' => 'nullable|string',
            'physical_examination' => 'required|string',
            'diagnosis' => 'required|string',
            'action_treatment' => 'required|string',
            'follow_up_notes' => 'nullable|string',
            'prescription_items' => 'nullable|array',
            'prescription_items.*.medicine_id' => 'required_with:prescription_items|integer|distinct|exists:obat,id',
            'prescription_items.*.quantity' => 'required_with:prescription_items|integer|min:1',
            'prescription_items.*.dosage_instructions' => 'required_with:prescription_items|string|max:255',
        ]);

        $doctorProfile = $request->user()->doctorProfile;

        if (! $doctorProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dokter tidak ditemukan.',
            ], 404);
        }

        return DB::transaction(function () use ($request, $validated, $doctorProfile) {
            $lockedQueue = Queue::where('doctor_profile_id', $doctorProfile->id)
                ->whereKey($request->queue_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedQueue->status !== 'Diperiksa' || MedicalRecord::where('queue_id', $lockedQueue->id)->exists()) {
                throw ValidationException::withMessages([
                    'queue_id' => ['Antrean tidak lagi tersedia untuk pemeriksaan.'],
                ]);
            }

            // 1. Buat Rekam Medis
            $record = MedicalRecord::create([
                'queue_id' => $lockedQueue->id,
                'patient_profile_id' => $lockedQueue->patient_profile_id,
                'doctor_profile_id' => $doctorProfile->id,
                'record_date' => Carbon::today()->toDateString(),
                'complaint' => $request->complaint,
                'blood_pressure' => $request->blood_pressure,
                'body_temperature' => $request->body_temperature,
                'body_weight' => $request->body_weight,
                'physical_examination' => $request->physical_examination,
                'diagnosis' => $request->diagnosis,
                'action_treatment' => $request->action_treatment,
                'follow_up_notes' => $request->follow_up_notes,
            ]);

            // 2. Jika ada peresepan obat
            if (! empty($validated['prescription_items'])) {
                $code = 'RX-'.Carbon::now()->format('Ymd').'-'.str_pad($record->id, 3, '0', STR_PAD_LEFT);

                $prescription = Prescription::create([
                    'prescription_code' => $code,
                    'medical_record_id' => $record->id,
                    'status' => 'Selesai',
                    'dispensed_at' => Carbon::now(),
                ]);

                foreach ($validated['prescription_items'] as $item) {
                    $medicine = Medicine::lockForUpdate()->findOrFail($item['medicine_id']);

                    // Validasi stok cukup
                    if ($medicine->stock < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'prescription_items' => ["Stok {$medicine->name} tidak mencukupi (tersedia: {$medicine->stock}, diminta: {$item['quantity']})."],
                        ]);
                    }

                    // Potong stok
                    $stockBefore = $medicine->stock;
                    $medicine->stock -= $item['quantity'];
                    $medicine->save();

                    // Simpan item resep
                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id' => $medicine->id,
                        'quantity' => $item['quantity'],
                        'dosage_instructions' => $item['dosage_instructions'],
                    ]);

                    // Catat mutasi stok farmasi
                    MedicineTransaction::create([
                        'medicine_id' => $medicine->id,
                        'type' => 'keluar',
                        'quantity' => $item['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $medicine->stock,
                        'reference_type' => 'resep_dokter',
                        'reference_id' => $code,
                        'notes' => 'Pengeluaran obat untuk rekam medis pasien',
                    ]);
                }
            }

            // 3. Update status antrean menjadi 'Selesai'
            $lockedQueue->status = 'Selesai';
            $lockedQueue->save();

            $record->load(['prescription.items.medicine', 'patientProfile.user']);

            return response()->json([
                'success' => true,
                'message' => 'Pemeriksaan dan rekam medis berhasil disimpan.',
                'data' => $record,
            ], 201);
        });
    }

    /**
     * Riwayat Rekam Medis terdahulu milik pasien tertentu
     */
    public function getPatientHistory(Request $request, $patientId)
    {
        $doctorProfile = $request->user()->doctorProfile;

        if (! $doctorProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dokter tidak ditemukan.',
            ], 404);
        }

        $isAssignedToDoctor = Queue::where('patient_profile_id', $patientId)
            ->where('doctor_profile_id', $doctorProfile->id)
            ->exists();

        if (! $isAssignedToDoctor) {
            return response()->json([
                'success' => false,
                'message' => 'Riwayat pasien hanya tersedia untuk dokter yang menangani antreannya.',
            ], 403);
        }

        $records = MedicalRecord::with(['doctorProfile.user', 'prescription.items.medicine'])
            ->where('patient_profile_id', $patientId)
            ->orderBy('record_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Katalog obat tersedia untuk resep
     */
    public function getAvailableMedicines()
    {
        $medicines = Medicine::where('stock', '>', 0)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $medicines,
        ]);
    }
}
