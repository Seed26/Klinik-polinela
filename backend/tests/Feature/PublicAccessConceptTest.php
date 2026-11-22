<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\PatientProfile;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PublicAccessConceptTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_data_is_preserved_and_patient_web_login_is_blocked(): void
    {
        $patient = User::factory()->create([
            'role' => 'patient',
            'is_active' => true,
            'password' => 'PatientTest123!',
        ]);

        $profile = PatientProfile::create([
            'user_id' => $patient->id,
            'identifier_number' => 'TEST-PATIENT-1001',
            'civitas_type' => 'mahasiswa',
        ]);

        $this->assertDatabaseHas('profil_pasien', [
            'id' => $profile->id,
            'user_id' => $patient->id,
            'identifier_number' => 'TEST-PATIENT-1001',
        ]);

        $this->assertSame('patient', DB::table('users')->where('id', $patient->id)->value('role'));

        $this->postJson('/api/auth/login', [
            'identifier' => $patient->email,
            'password' => 'PatientTest123!',
            'client' => 'web',
        ])->assertForbidden()
            ->assertJsonPath('success', false);

        $this->postJson('/api/auth/login', [
            'identifier' => $patient->email,
            'password' => 'PatientTest123!',
        ])->assertOk()
            ->assertJsonPath('data.user.role', 'patient');

        $this->assertDatabaseHas('profil_pasien', ['id' => $profile->id]);
    }

    public function test_doctor_cannot_reuse_completed_queue_for_a_second_medical_record(): void
    {
        $doctor = $this->createDoctorProfile();
        $patient = $this->createPatientProfile();
        $queue = Queue::create([
            'queue_number' => 'A-002',
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->toDateString(),
            'status' => 'Diperiksa',
        ]);
        DB::table('rekam_medis')->insert([
            'queue_id' => $queue->id,
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'record_date' => now()->toDateString(),
            'complaint' => 'Keluhan tersimpan',
            'physical_examination' => 'Pemeriksaan tersimpan',
            'diagnosis' => 'Diagnosis tersimpan',
            'action_treatment' => 'Tindakan tersimpan',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue->id,
            'complaint' => 'Keluhan kedua',
            'physical_examination' => 'Pemeriksaan kedua',
            'diagnosis' => 'Diagnosis kedua',
            'action_treatment' => 'Tindakan kedua',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('rekam_medis', 1);
    }

    private function createPatientProfile(): PatientProfile
    {
        $user = User::factory()->create(['role' => 'patient']);

        return PatientProfile::create([
            'user_id' => $user->id,
            'identifier_number' => fake()->unique()->numerify('########'),
            'civitas_type' => 'mahasiswa',
        ]);
    }

    private function createDoctorProfile(): DoctorProfile
    {
        $user = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

        return DoctorProfile::create([
            'user_id' => $user->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
        ]);
    }

    public function test_doctor_cannot_call_or_examine_unassigned_patient_queue(): void
    {
        $doctor = $this->createDoctorProfile();
        $otherDoctor = $this->createDoctorProfile();
        $patient = $this->createPatientProfile();
        $queue = DB::table('antrean')->insertGetId([
            'queue_number' => 'A-900',
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $otherDoctor->id,
            'visit_date' => now()->toDateString(),
            'status' => 'Menunggu',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($doctor->user)->postJson("/api/doctor/queues/{$queue}/call")
            ->assertNotFound();
        $this->actingAs($doctor->user)->postJson('/api/doctor/examinations', [
            'queue_id' => $queue,
            'complaint' => 'Keluhan uji fiktif',
            'physical_examination' => 'Pemeriksaan uji fiktif',
            'diagnosis' => 'Diagnosis uji fiktif',
            'action_treatment' => 'Tindakan uji fiktif',
        ])->assertNotFound();

        $this->assertDatabaseHas('antrean', ['id' => $queue, 'status' => 'Menunggu']);
        $this->assertDatabaseCount('rekam_medis', 0);
    }

    public function test_doctor_cannot_access_another_doctors_patient_history(): void
    {
        $doctor = $this->createDoctorProfile();
        $otherDoctor = $this->createDoctorProfile();
        $patient = $this->createPatientProfile();

        DB::table('antrean')->insert([
            'queue_number' => 'A-901',
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $otherDoctor->id,
            'visit_date' => now()->toDateString(),
            'status' => 'Selesai',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($doctor->user)->getJson("/api/doctor/patient-history/{$patient->id}")
            ->assertForbidden();
    }

    public function test_admin_and_doctor_can_authenticate_using_web_api(): void
    {
        foreach (['admin', 'doctor'] as $role) {
            $user = User::factory()->create([
                'role' => $role,
                'is_active' => true,
                'password' => 'StaffTest123!',
            ]);

            $this->postJson('/api/auth/login', [
                'identifier' => $user->email,
                'password' => 'StaffTest123!',
                'client' => 'web',
            ])->assertOk()
                ->assertJsonPath('data.user.role', $role);
        }
    }
}
