<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\PatientProfile;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DoctorWorkflowSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_can_call_an_assigned_waiting_queue(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $doctor, 'Menunggu');

        $this->actingAs($doctor->user)->postJson("/api/doctor/queues/{$queue->id}/call")
            ->assertOk()
            ->assertJsonPath('data.status', 'Diperiksa');

        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Diperiksa']);
    }

    public function test_doctor_can_examine_an_assigned_queue_and_queue_is_completed(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $doctor, 'Diperiksa');

        $response = $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue->id,
            'complaint' => 'Keluhan uji integrasi fiktif',
            'blood_pressure' => '120/80',
            'body_temperature' => '36.5',
            'body_weight' => '60',
            'physical_examination' => 'Pemeriksaan uji fiktif',
            'diagnosis' => 'Diagnosis uji fiktif',
            'action_treatment' => 'Tindakan uji fiktif',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.queue_id', $queue->id)
            ->assertJsonPath('data.patient_profile_id', $patient->id);

        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Selesai']);
        $this->assertDatabaseHas('rekam_medis', [
            'queue_id' => $queue->id,
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'diagnosis' => 'Diagnosis uji fiktif',
        ]);
    }

    public function test_examination_validation_failure_does_not_create_a_record_or_finish_queue(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $doctor, 'Diperiksa');

        $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue->id,
            'complaint' => 'Keluhan uji fiktif',
            'physical_examination' => 'Pemeriksaan uji fiktif',
            'diagnosis' => 'Diagnosis uji fiktif',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('rekam_medis', 0);
        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Diperiksa']);
    }

    public function test_doctor_cannot_call_another_doctors_queue_or_view_their_patient_history(): void
    {
        $doctor = $this->createDoctor();
        $otherDoctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $otherDoctor, 'Menunggu');

        $this->actingAs($doctor->user)->postJson("/api/doctor/queues/{$queue->id}/call")
            ->assertNotFound();

        $this->actingAs($doctor->user)->getJson("/api/doctor/patient-history/{$patient->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Menunggu']);
    }

    public function test_doctor_can_issue_prescription_and_record_stock_movement_atomically(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $doctor, 'Diperiksa');
        $medicineId = DB::table('obat')->insertGetId([
            'name' => 'Obat resep uji',
            'category' => 'Uji',
            'form' => 'Tablet',
            'stock' => 5,
            'min_stock_alert' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue->id,
            'complaint' => 'Keluhan uji fiktif',
            'physical_examination' => 'Pemeriksaan uji fiktif',
            'diagnosis' => 'Diagnosis uji fiktif',
            'action_treatment' => 'Tindakan uji fiktif',
            'prescription_items' => [[
                'medicine_id' => $medicineId,
                'quantity' => 2,
                'dosage_instructions' => '1x sehari untuk keperluan tes',
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.prescription.items.0.quantity', 2);

        $this->assertDatabaseHas('obat', ['id' => $medicineId, 'stock' => 3]);
        $this->assertDatabaseHas('transaksi_obat', [
            'medicine_id' => $medicineId,
            'type' => 'keluar',
            'quantity' => 2,
            'stock_before' => 5,
            'stock_after' => 3,
        ]);
        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Selesai']);
    }

    public function test_non_doctor_cannot_call_queues_or_submit_examinations(): void
    {
        $patientUser = User::factory()->create(['role' => 'patient', 'is_active' => true]);

        $this->actingAs($patientUser)
            ->getJson('/api/doctor/dashboard')
            ->assertForbidden();

        $this->actingAs($patientUser)
            ->postJson('/api/doctor/examinations', [])
            ->assertForbidden();
    }

    public function test_insufficient_prescription_stock_rolls_back_record_and_queue_status(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();
        $queue = $this->createQueue($patient, $doctor, 'Diperiksa');
        $medicineId = DB::table('obat')->insertGetId([
            'name' => 'Obat uji fiktif',
            'category' => 'Uji',
            'form' => 'Tablet',
            'stock' => 1,
            'min_stock_alert' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue->id,
            'complaint' => 'Keluhan uji fiktif',
            'physical_examination' => 'Pemeriksaan uji fiktif',
            'diagnosis' => 'Diagnosis uji fiktif',
            'action_treatment' => 'Tindakan uji fiktif',
            'prescription_items' => [[
                'medicine_id' => $medicineId,
                'quantity' => 2,
                'dosage_instructions' => '1x sehari untuk keperluan tes',
            ]],
        ])->assertUnprocessable();

        $this->assertDatabaseCount('rekam_medis', 0);
        $this->assertDatabaseHas('antrean', ['id' => $queue->id, 'status' => 'Diperiksa']);
        $this->assertDatabaseHas('obat', ['id' => $medicineId, 'stock' => 1]);
        $this->assertDatabaseCount('transaksi_obat', 0);
    }

    private function createDoctor(): DoctorProfile
    {
        $user = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

        return DoctorProfile::create([
            'user_id' => $user->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
        ]);
    }

    private function createPatient(): PatientProfile
    {
        $user = User::factory()->create(['role' => 'patient']);

        return PatientProfile::create([
            'user_id' => $user->id,
            'identifier_number' => fake()->unique()->numerify('########'),
            'civitas_type' => 'mahasiswa',
        ]);
    }

    private function createQueue(PatientProfile $patient, DoctorProfile $doctor, string $status): Queue
    {
        return Queue::create([
            'queue_number' => 'A-'.fake()->unique()->numerify('###'),
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->toDateString(),
            'status' => $status,
        ]);
    }
}
