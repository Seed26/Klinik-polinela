<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\PatientProfile;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminQueueRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_register_a_patient_and_assign_a_daily_queue_number(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $patient = $this->createPatientProfile();
        $doctor = $this->createDoctorProfile();
        $visitDate = now()->addDay()->toDateString();

        $response = $this->actingAs($admin)->postJson('/api/admin/queues', [
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => $visitDate,
            'complaint' => 'Keluhan uji fiktif',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.queue_number', 'A-001')
            ->assertJsonPath('data.status', 'Menunggu');

        $this->assertDatabaseHas('antrean', [
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => $visitDate,
            'queue_number' => 'A-001',
        ]);
    }

    public function test_admin_cannot_register_duplicate_patient_queue_for_the_same_date(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $patient = $this->createPatientProfile();
        $doctor = $this->createDoctorProfile();
        $visitDate = now()->addDay()->toDateString();

        Queue::create([
            'queue_number' => 'A-001',
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => $visitDate,
            'estimated_time' => '09:00:00',
            'status' => 'Menunggu',
        ]);

        $this->actingAs($admin)->postJson('/api/admin/queues', [
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => $visitDate,
        ])->assertUnprocessable();

        $this->assertDatabaseCount('antrean', 1);
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
        $user = User::factory()->create(['role' => 'doctor']);

        return DoctorProfile::create([
            'user_id' => $user->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
        ]);
    }

    public function test_patient_role_is_forbidden_from_admin_queue_registration(): void
    {
        $patientUser = User::factory()->create(['role' => 'patient', 'is_active' => true]);
        $patient = $this->createPatientProfile();
        $doctor = $this->createDoctorProfile();

        $this->actingAs($patientUser)->postJson('/api/admin/queues', [
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->addDay()->toDateString(),
        ])->assertForbidden();

        $this->assertDatabaseCount('antrean', 0);
    }
}
